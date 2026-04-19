import { Router } from 'express';
import pool from './db';
import type { AuthRequest } from './auth';
import { writeAuditLog } from './audit';

const router = Router();

const resolveTipoMiembro = (tipoPaciente: string) => {
  const normalized = tipoPaciente.toLowerCase();
  if (normalized.includes('estudiante')) return 'estudiante';
  if (normalized.includes('profesor')) return 'profesor';
  return 'personal';
};

const resolvePrioridad = (prioridad: unknown) => {
  const normalized = String(prioridad ?? '').trim().toLowerCase();
  if (['baja', 'low'].includes(normalized)) return 'baja';
  if (['media', 'normal', 'medium'].includes(normalized)) return 'media';
  if (['alta', 'high'].includes(normalized)) return 'alta';
  if (['critica', 'crítica', 'urgent', 'urgente'].includes(normalized)) return 'critica';
  return 'media';
};

const serializeMedicamentos = (medicamentos: unknown) => {
  if (typeof medicamentos === 'string') {
    return medicamentos;
  }

  if (Array.isArray(medicamentos)) {
    return medicamentos
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

router.post('/', async (req: AuthRequest, res) => {
  const {
    tipo_paciente,
    carnet_uni,
    codigo_empleado,
    nombre,
    apellido,
    email,
    telefono,
    carrera,
    departamento,
    categoria,
    cargo,
    motivo,
    sintomas,
    diagnostico,
    medicamentos,
    notas_recom,
    prioridad,
    paciente_id: expedienteIdFromFrontend
  } = req.body;

  if (!motivo || !prioridad) {
    return res.status(400).json({ error: 'Motivo y prioridad son obligatorios' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let expedienteId = expedienteIdFromFrontend ? String(expedienteIdFromFrontend) : undefined;

    if (!expedienteId) {
      const tipoMiembro = resolveTipoMiembro(tipo_paciente ?? 'personal');
      const codigoInstitucional = tipoMiembro === 'estudiante' ? carnet_uni : codigo_empleado;

      let personaId: string | undefined;

      if (codigoInstitucional) {
        const existingPerson = await client.query(
          'SELECT id FROM personas WHERE codigo_institucional = $1',
          [codigoInstitucional]
        );
        if (existingPerson.rowCount && existingPerson.rows[0]) {
          personaId = existingPerson.rows[0].id;
        }
      }

      if (!personaId && email) {
        const existingEmail = await client.query(
          'SELECT id FROM personas WHERE LOWER(correo_institucional::text) = LOWER($1)',
          [email]
        );
        if (existingEmail.rowCount && existingEmail.rows[0]) {
          personaId = existingEmail.rows[0].id;
        }
      }

      if (!personaId && nombre && apellido) {
        const existingName = await client.query(
          'SELECT id FROM personas WHERE LOWER(nombres) = LOWER($1) AND LOWER(apellidos) = LOWER($2) LIMIT 1',
          [nombre.trim(), apellido.trim()]
        );
        if (existingName.rowCount && existingName.rows[0]) {
          personaId = existingName.rows[0].id;
        }
      }

      if (!personaId) {
        const personaResult = await client.query(
          `
            INSERT INTO personas (
              tipo_miembro,
              codigo_institucional,
              nombres,
              apellidos,
              correo_institucional,
              telefono,
              carrera_depto,
              categoria,
              cargo
            ) VALUES ($1::tipo_miembro, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
          `,
          [
            tipoMiembro,
            codigoInstitucional || null,
            nombre,
            apellido,
            email || null,
            telefono || null,
            carrera || departamento || null,
            categoria || null,
            cargo || null,
          ]
        );
        personaId = personaResult.rows[0].id;
      }

      const existingExpediente = await client.query(
        'SELECT id FROM expedientes WHERE persona_id = $1 LIMIT 1',
        [personaId]
      );

      if (existingExpediente.rowCount && existingExpediente.rows[0]) {
        expedienteId = existingExpediente.rows[0].id;
      } else {
        const expedienteResult = await client.query(
          `
            INSERT INTO expedientes (persona_id)
            VALUES ($1)
            RETURNING id
          `,
          [personaId]
        );

        expedienteId = expedienteResult.rows[0].id;
      }
    }

    const consultaResult = await client.query(
      `
        INSERT INTO consultas (
          expediente_id,
          profesional_user_id,
          motivo,
          sintomas,
          diagnostico,
          notas_recomendacion,
          prioridad
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::prioridad_consulta)
        RETURNING id
      `,
      [
        expedienteId,
        req.user?.id ?? null,
        motivo,
        sintomas || null,
        diagnostico || null,
        notas_recom || null,
        resolvePrioridad(prioridad),
      ]
    );

    const consultaId = consultaResult.rows[0].id;

    if (medicamentos) {
      const listaMedicamentos = typeof medicamentos === 'string'
        ? medicamentos.split('\n').filter((item: string) => item.trim() !== '')
        : (Array.isArray(medicamentos) ? medicamentos : []);

      for (const nombreMedicamento of listaMedicamentos) {
        const nombreLimpiado = String(nombreMedicamento).trim();
        if (!nombreLimpiado) continue;

        const medResult = await client.query(
          'SELECT id, stock_actual FROM inventario_items WHERE LOWER(nombre) = LOWER($1)',
          [nombreLimpiado]
        );

        let inventarioItemId = null;
        let stock_actual = 0;

        if (medResult.rows.length > 0) {
          inventarioItemId = medResult.rows[0].id;
          stock_actual = Number(medResult.rows[0].stock_actual);

          if (stock_actual > 0) {
            const stockResultante = stock_actual - 1;
            await client.query(
              'UPDATE inventario_items SET stock_actual = $1 WHERE id = $2',
              [stockResultante, inventarioItemId]
            );

            await client.query(
              `
                INSERT INTO inventario_movimientos (
                  inventario_item_id,
                  tipo_movimiento,
                  cantidad,
                  stock_anterior,
                  stock_resultante,
                  motivo,
                  referencia_consulta_id,
                  registrado_por_user_id
                ) VALUES ($1, 'consumo_consulta', 1, $2, $3, $4, $5, $6)
              `,
              [
                inventarioItemId,
                stock_actual,
                stockResultante,
                `Consumo por consulta ${consultaId}`,
                consultaId,
                req.user?.id ?? null,
              ]
            );
          }
        }

        await client.query(
          `
            INSERT INTO consulta_medicamentos (
              consulta_id,
              inventario_item_id,
              nombre_medicamento,
              cantidad
            ) VALUES ($1, $2, $3, 1)
          `,
          [consultaId, inventarioItemId, nombreLimpiado]
        );
      }
    }

    await client.query('COMMIT');
    await writeAuditLog({
      userId: req.user?.id ?? null,
      accion: 'consulta_creada',
      modulo: 'consultas',
      recurso: String(consultaId),
      metadata: {
        expediente_id: expedienteId,
        motivo,
        prioridad: resolvePrioridad(prioridad),
        medicamentos: serializeMedicamentos(medicamentos),
      },
    });
    res.status(201).json({ message: 'Consulta creada exitosamente', id: consultaId });
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    console.error('Error en backend:', err);
    const error = err instanceof Error ? err : new Error('Error desconocido');
    if (error.message.includes('Medicamento no encontrado') || error.message.includes('No hay stock')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al crear la consulta' });
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const { paciente_id } = req.query;
    if (!paciente_id) {
      return res.status(400).json({ error: 'Falta paciente_id' });
    }
    const rows = await pool.query(
      `
        SELECT
          c.id,
          c.motivo,
          c.sintomas,
          c.diagnostico,
          (
            SELECT string_agg(cm.nombre_medicamento, E'\n' ORDER BY cm.id)
            FROM consulta_medicamentos cm
            WHERE cm.consulta_id = c.id
          ) as medicamentos,
          c.notas_recomendacion as notas_recom,
          c.prioridad,
          c.creado_en
        FROM consultas c
        WHERE c.expediente_id = $1
        ORDER BY c.creado_en DESC
      `,
      [String(paciente_id)]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error('Error obteniendo consultas:', err);
    res.status(500).json({ error: 'Error al obtener consultas' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { motivo, sintomas, diagnostico, notas_recom, prioridad } = req.body;

    if (!motivo || !prioridad) {
      return res.status(400).json({ error: 'Motivo y prioridad son obligatorios' });
    }

  try {
    const result = await pool.query(
      `
        UPDATE consultas SET
          motivo = $1,
          sintomas = $2,
          diagnostico = $3,
          notas_recomendacion = $4,
          prioridad = $5::prioridad_consulta
        WHERE id = $6
        RETURNING id, motivo, sintomas, diagnostico, notas_recomendacion as notas_recom, prioridad, creado_en
      `,
      [
        motivo ?? null,
        sintomas ?? null,
        diagnostico ?? null,
        notas_recom ?? null,
        resolvePrioridad(prioridad),
        id
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar consulta:', err);
    res.status(500).json({ error: 'Error al actualizar la consulta' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM consultas WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar consulta:', err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;
