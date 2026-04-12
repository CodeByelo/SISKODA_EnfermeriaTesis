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
        [Number(paciente_id)]
      );
      return res.json(rows.rows ?? []);
    }

    const rows = await pool.query(`
      SELECT
        c.id,
        p.nombres as nombre,
        p.apellidos as apellido,
        p.codigo_institucional as carnet_uni,
        c.motivo,
        c.prioridad,
        TO_CHAR(c.creado_en, 'HH24:MI') AS hora
      FROM consultas c
      INNER JOIN expedientes e ON c.expediente_id = e.id
      INNER JOIN personas p ON e.persona_id = p.id
      WHERE c.creado_en::date = CURRENT_DATE
      ORDER BY c.creado_en DESC
    `);

    res.json(rows.rows ?? []);
  } catch (err) {
    console.error('Error obteniendo consultas:', err);
    res.status(500).json([]);
  }
});

export default router;
