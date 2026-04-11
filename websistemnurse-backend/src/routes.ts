// src/routes.ts
import { Router } from 'express';
import pool from './db';

const router = Router();

/**
 * Router principal para crear y gestionar consultas médicas.
 *
 * Resumen:
 * - POST `/` : Crea (o asocia) un expediente de paciente y registra una consulta.
 *   - Si se incluyen `medicamentos`, intenta decrementar stock por cada medicamento listado (una unidad cada uno).
 * - GET `/` : Lista consultas de un paciente (requiere `paciente_id` en query).
 * - DELETE `/:id` : Elimina una consulta por id.
 *
 * Notas importantes:
 * - Opera en transacciones (BEGIN / COMMIT / ROLLBACK) para asegurar consistencia entre `expedientes`, `consultas` e `inventario`.
 * - Valida la existencia de carnet o código de empleado para evitar duplicados cuando corresponda.
 * - Si un medicamento no existe en `inventario` o no tiene stock, la creación de la consulta falla y se hace ROLLBACK.
 */


router.post('/', async (req, res) => {
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
    paciente_id: idFromFrontend
  } = req.body;

  if (!motivo || !prioridad) {
    return res.status(400).json({ error: 'Motivo y prioridad son obligatorios' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let pacienteId = idFromFrontend ? Number(idFromFrontend) : undefined;

    if (!pacienteId) {
      if (carnet_uni) {
        const existing = await client.query(
          'SELECT id FROM expedientes WHERE carnet_uni = $1 AND tipo_paciente = $2',
          [carnet_uni, tipo_paciente]
        );
        if (existing.rows.length > 0) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(409).json({
            error: 'PACIENTE_EXISTE',
            message: 'Ya existe un paciente con este carnet y tipo.',
          });
        }
      }

      if (codigo_empleado) {
        const existing = await client.query(
          'SELECT id FROM expedientes WHERE codigo_empleado = $1 AND tipo_paciente = $2',
          [codigo_empleado, tipo_paciente]
        );
        if (existing.rows.length > 0) {
          pacienteId = existing.rows[0].id;
        }
      }

      if (!pacienteId) {
        const pacienteResult = await client.query(
          `INSERT INTO expedientes (
            tipo_paciente,
            carnet_uni,
            codigo_empleado,
            nombre,
            apellido,
            email,
            telefono,
            carrera_depto,
            categoria,
            cargo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id`,
          [
            tipo_paciente,
            carnet_uni || null,
            codigo_empleado || null,
            nombre,
            apellido,
            email || null,
            telefono || null,
            carrera || departamento || null,
            categoria || null,
            cargo || null
          ]
        );
        pacienteId = pacienteResult.rows[0].id;
      }
    }

    const consultaResult = await client.query(
      `INSERT INTO consultas (
        paciente_id,
        motivo,
        sintomas,
        diagnostico,
        medicamentos,
        notas_recom,
        prioridad
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        pacienteId,
        motivo || null,
        sintomas || null,
        diagnostico || null,
        medicamentos || null,
        notas_recom || null,
        prioridad
      ]
    );

    const consultaId = consultaResult.rows[0].id;

    if (medicamentos) {
      const listaMedicamentos = typeof medicamentos === 'string'
        ? medicamentos.split('\n').filter(m => m.trim() !== '')
        : (Array.isArray(medicamentos) ? medicamentos : []);

      for (const nombreMedicamento of listaMedicamentos) {
        const nombreLimpiado = nombreMedicamento.trim();
        if (!nombreLimpiado) continue;

        const medResult = await client.query(
          'SELECT id, stock_actual FROM inventario WHERE LOWER(nombre) = LOWER($1)',
          [nombreLimpiado]
        );

        if (medResult.rows.length === 0) {
          throw new Error(`Medicamento no encontrado: "${nombreLimpiado}"`);
        }

        const { id: medicamentoId, stock_actual } = medResult.rows[0];

        if (stock_actual <= 0) {
          throw new Error(`No hay stock disponible para: "${nombreLimpiado}"`);
        }

        await client.query(
          'UPDATE inventario SET stock_actual = stock_actual - 1 WHERE id = $1',
          [medicamentoId]
        );
      }
    }

    await client.query('COMMIT');
    client.release();

    res.status(201).json({ message: 'Consulta creada exitosamente', id: consultaId });
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error en backend:', err);
    const error = err instanceof Error ? err : new Error('Error desconocido');
    if (error.message.includes('Medicamento no encontrado') || error.message.includes('No hay stock')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al crear la consulta' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { paciente_id } = req.query;
    if (!paciente_id) {
      return res.status(400).json({ error: 'Falta paciente_id' });
    }
    const rows = await pool.query(
      `SELECT id, motivo, sintomas, diagnostico, medicamentos, notas_recom, prioridad, creado_en
       FROM consultas
       WHERE paciente_id = $1
       ORDER BY creado_en DESC`,
      [Number(paciente_id)]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error("Error obteniendo consultas:", err);
    res.status(500).json({ error: 'Error al obtener consultas' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { motivo, sintomas, diagnostico, medicamentos, notas_recom, prioridad } = req.body;

  if (!motivo || !prioridad) {
    return res.status(400).json({ error: 'Motivo y prioridad son obligatorios' });
  }

  try {
    const result = await pool.query(
      `UPDATE consultas SET
        motivo = $1, sintomas = $2, diagnostico = $3, medicamentos = $4, notas_recom = $5, prioridad = $6
       WHERE id = $7
       RETURNING id, motivo, sintomas, diagnostico, medicamentos, notas_recom, prioridad, creado_en`,
      [
        motivo ?? null,
        sintomas ?? null,
        diagnostico ?? null,
        medicamentos ?? null,
        notas_recom ?? null,
        prioridad,
        Number(id)
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
    const result = await pool.query('DELETE FROM consultas WHERE id = $1 RETURNING id', [Number(id)]);
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
