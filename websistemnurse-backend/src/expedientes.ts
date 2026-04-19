import { Router } from 'express';
import pool from './db';
import type { AuthRequest } from './auth';
import { writeAuditLog } from './audit';

const router = Router();

const mapTipoMiembroToPaciente = (tipo: string) => {
  switch (tipo) {
    case 'estudiante':
      return 'Estudiante';
    case 'profesor':
      return 'Profesor';
    case 'personal':
      return 'Personal Administrativo';
    default:
      return 'Interno';
  }
};

router.get('/check', async (req, res) => {
  const { carnet, tipo } = req.query;
  if (!carnet || !tipo) {
    return res.status(400).json({ error: 'Faltan parametros' });
  }

  const result = await pool.query(
    `
      SELECT e.id
      FROM expedientes e
      INNER JOIN personas p ON p.id = e.persona_id
      WHERE p.codigo_institucional = $1
        AND LOWER(p.tipo_miembro::text) = LOWER($2)
    `,
    [String(carnet), String(tipo)]
  );

  res.json({ exists: result.rows.length > 0 });
});

router.get('/', async (_req, res) => {
  try {
    const rows = await pool.query(`
      SELECT
        e.id,
        CASE
          WHEN p.tipo_miembro = 'estudiante' THEN 'Estudiante'
          WHEN p.tipo_miembro = 'profesor' THEN 'Profesor'
          WHEN p.tipo_miembro = 'personal' THEN 'Personal Administrativo'
          ELSE 'Interno'
        END as tipo_paciente,
        CASE WHEN p.tipo_miembro = 'estudiante' THEN p.codigo_institucional ELSE NULL END as carnet_uni,
        CASE WHEN p.tipo_miembro <> 'estudiante' THEN p.codigo_institucional ELSE NULL END as codigo_empleado,
        p.nombres as nombre,
        p.apellidos as apellido,
        p.correo_institucional as email,
        p.telefono,
        p.carrera_depto,
        p.categoria,
        p.cargo,
        e.creado_en,
        e.actualizado_en
      FROM expedientes e
      INNER JOIN personas p ON p.id = e.persona_id
      ORDER BY e.creado_en DESC
    `);
    res.json(rows.rows);
  } catch (err) {
    console.error('Error al obtener expedientes:', err);
    res.status(500).json({ error: 'Error al obtener expedientes' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  const {
    tipo_paciente,
    carnet_uni,
    codigo_empleado,
    nombre,
    apellido,
    email,
    telefono,
    carrera_depto,
    categoria,
    cargo,
  } = req.body;

  if (!tipo_paciente || !nombre?.trim() || !apellido?.trim()) {
    return res.status(400).json({ error: 'Tipo, nombre y apellido son obligatorios' });
  }

  const tipoMiembro =
    String(tipo_paciente).toLowerCase().includes('estudiante')
      ? 'estudiante'
      : String(tipo_paciente).toLowerCase().includes('profesor')
        ? 'profesor'
        : 'personal';

  try {
    const code = tipoMiembro === 'estudiante' ? carnet_uni : codigo_empleado;

    if (code) {
      const existingCode = await pool.query(
        'SELECT id FROM personas WHERE codigo_institucional = $1',
        [code]
      );

      if ((existingCode.rowCount ?? 0) > 0) {
        return res.status(409).json({ error: 'Ya existe una persona con ese codigo institucional' });
      }
    }

    const person = await pool.query(
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
        RETURNING *
      `,
      [
        tipoMiembro,
        code || null,
        nombre.trim(),
        apellido.trim(),
        email || null,
        telefono || null,
        carrera_depto || null,
        categoria || null,
        cargo || null,
      ]
    );

    const expediente = await pool.query(
      `
        INSERT INTO expedientes (persona_id)
        VALUES ($1)
        RETURNING *
      `,
      [person.rows[0].id]
    );

    await writeAuditLog({
      userId: req.user?.id ?? null,
      personaId: person.rows[0].id,
      accion: 'expediente_creado',
      modulo: 'expedientes',
      recurso: String(expediente.rows[0].id),
      metadata: {
        tipo_paciente: mapTipoMiembroToPaciente(tipoMiembro),
        nombre: person.rows[0].nombres,
        apellido: person.rows[0].apellidos,
        codigo_institucional: code || null,
      },
    });

    res.status(201).json({
      id: expediente.rows[0].id,
      tipo_paciente: mapTipoMiembroToPaciente(tipoMiembro),
      carnet_uni: tipoMiembro === 'estudiante' ? code : null,
      codigo_empleado: tipoMiembro !== 'estudiante' ? code : null,
      nombre: person.rows[0].nombres,
      apellido: person.rows[0].apellidos,
      email: person.rows[0].correo_institucional,
      telefono: person.rows[0].telefono,
      carrera_depto: person.rows[0].carrera_depto,
      categoria: person.rows[0].categoria,
      cargo: person.rows[0].cargo,
      creado_en: expediente.rows[0].creado_en,
      actualizado_en: expediente.rows[0].actualizado_en,
    });
  } catch (err) {
    console.error('Error al crear expediente:', err);
    res.status(500).json({ error: 'Error al crear expediente' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          e.id,
          CASE
            WHEN p.tipo_miembro = 'estudiante' THEN 'Estudiante'
            WHEN p.tipo_miembro = 'profesor' THEN 'Profesor'
            WHEN p.tipo_miembro = 'personal' THEN 'Personal Administrativo'
            ELSE 'Interno'
          END as tipo_paciente,
          CASE WHEN p.tipo_miembro = 'estudiante' THEN p.codigo_institucional ELSE NULL END as carnet_uni,
          CASE WHEN p.tipo_miembro <> 'estudiante' THEN p.codigo_institucional ELSE NULL END as codigo_empleado,
          p.nombres as nombre,
          p.apellidos as apellido,
          p.correo_institucional as email,
          p.telefono,
          p.carrera_depto,
          p.categoria,
          p.cargo,
          e.creado_en,
          e.actualizado_en
        FROM expedientes e
        INNER JOIN personas p ON p.id = e.persona_id
        WHERE e.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener expediente:', err);
    res.status(500).json({ error: 'Error al obtener el expediente' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  try {
    const beforeDelete = await pool.query(
      `
        SELECT e.id, e.persona_id, p.nombres, p.apellidos, p.codigo_institucional
        FROM expedientes e
        INNER JOIN personas p ON p.id = e.persona_id
        WHERE e.id = $1
      `,
      [id]
    );

    const result = await pool.query('DELETE FROM expedientes WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    if (beforeDelete.rowCount && beforeDelete.rows[0]) {
      await writeAuditLog({
        userId: req.user?.id ?? null,
        personaId: beforeDelete.rows[0].persona_id,
        accion: 'expediente_eliminado',
        modulo: 'expedientes',
        recurso: String(id),
        metadata: {
          nombre: beforeDelete.rows[0].nombres,
          apellido: beforeDelete.rows[0].apellidos,
          codigo_institucional: beforeDelete.rows[0].codigo_institucional ?? null,
        },
      });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar expediente:', err);
    res.status(500).json({ error: 'Error al eliminar el expediente' });
  }
});

export default router;
