// src/consultas-hoy.ts
import { Router } from "express";
import pool from './db';

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { paciente_id } = req.query;

    if (paciente_id) {
      const rows = await pool.query(`
        SELECT
          c.id,
          c.paciente_id,
          c.motivo,
          c.sintomas,
          c.diagnostico,
          c.medicamentos,
          c.notas_recom,
          c.prioridad,
          c.creado_en
        FROM consultas c
        WHERE c.paciente_id = $1
        ORDER BY c.creado_en DESC;
      `, [Number(paciente_id)]);
      return res.json(rows.rows ?? []);
    }

    // ✅ Usa NOW() en la base de datos para comparar en la misma zona horaria
    const rows = await pool.query(`
      SELECT
        c.id,
        e.nombre,
        e.apellido,
        e.carnet_uni,
        c.motivo,
        c.prioridad,
        TO_CHAR(c.creado_en, 'HH24:MI') AS hora
      FROM consultas c
      JOIN expedientes e ON c.paciente_id = e.id
      WHERE c.creado_en::date = CURRENT_DATE
      ORDER BY c.creado_en DESC;
    `);

    res.json(rows.rows ?? []);
  } catch (err) {
    console.error("Error obteniendo consultas:", err);
    res.status(500).json([]);
  }
});

export default router;