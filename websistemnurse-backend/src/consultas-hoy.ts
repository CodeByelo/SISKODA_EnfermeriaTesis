import { Router } from 'express';
import pool from './db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { paciente_id } = req.query;

    if (paciente_id) {
      const rows = await pool.query(
        `
          SELECT
            c.id,
            c.expediente_id as paciente_id,
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
      return res.json(rows.rows ?? []);
    }

    const timezone = process.env.APP_TIMEZONE || 'America/Caracas';

    const rows = await pool.query(`
      SELECT
        c.id,
        p.nombres as nombre,
        p.apellidos as apellido,
        COALESCE(p.codigo_institucional, p.cedula) as carnet_uni,
        c.motivo,
        c.prioridad,
        TO_CHAR(COALESCE(c.fecha_consulta, c.creado_en) AT TIME ZONE $1, 'HH12:MI AM') AS hora
      FROM consultas c
      INNER JOIN expedientes e ON c.expediente_id = e.id
      INNER JOIN personas p ON e.persona_id = p.id
      WHERE (COALESCE(c.fecha_consulta, c.creado_en) AT TIME ZONE $1)::date = (NOW() AT TIME ZONE $1)::date
      ORDER BY COALESCE(c.fecha_consulta, c.creado_en) DESC
    `, [timezone]);

    res.json(rows.rows ?? []);
  } catch (err) {
    console.error('Error obteniendo consultas:', err);
    res.status(500).json([]);
  }
});

export default router;
