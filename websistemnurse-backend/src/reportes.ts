// src/reportes.ts
import { Router } from 'express';
import pool from './db';

const router = Router();

// GET /api/reportes/consultas-por-prioridad
router.get('/consultas-por-prioridad', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT prioridad, COUNT(*)::int as cantidad
      FROM consultas
      GROUP BY prioridad;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener datos de prioridad' });
  }
});

// GET /api/reportes/medicamentos-mas-usados
router.get('/medicamentos-mas-usados', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TRIM(UNNEST(string_to_array(medicamentos, E'\n'))) AS medicamento,
        COUNT(*)::int as uso
      FROM consultas
      WHERE medicamentos IS NOT NULL AND medicamentos != ''
      GROUP BY medicamento
      ORDER BY uso DESC
      LIMIT 10;
    `);
    res.json(result.rows.filter(r => r.medicamento?.trim()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
});

// GET /api/reportes/consultas-por-dia
router.get('/consultas-por-dia', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(creado_en) as fecha,
        COUNT(*)::int as total
      FROM consultas
      WHERE creado_en >= NOW() - INTERVAL '14 days'
      GROUP BY fecha
      ORDER BY fecha ASC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tendencia' });
  }
});

// GET /api/reportes/stock-por-insumo
router.get('/stock-por-insumo', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT nombre, stock_actual
      FROM inventario
      WHERE stock_actual > 0
      ORDER BY stock_actual DESC
      LIMIT 10;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener stock de insumos' });
  }
});

// GET /api/reportes/excel → descarga Excel completo
import * as xlsx from 'xlsx';

router.get('/excel', async (_req, res) => {
  try {
    // 1. Consultas por prioridad
    const consultasPrioridad = await pool.query(`
      SELECT prioridad, COUNT(*)::int as total
      FROM consultas
      GROUP BY prioridad
      ORDER BY total DESC
    `);

    // 2. Stock actual de insumos
    const stock = await pool.query(`
      SELECT nombre, stock_actual, unidad_medida, actualizado_en
      FROM inventario
      WHERE stock_actual > 0
      ORDER BY nombre
    `);

    // 3. Tendencia últimos 14 días
    const tendencia = await pool.query(`
      SELECT DATE(creado_en) as dia, COUNT(*)::int as total
      FROM consultas
      WHERE creado_en >= NOW() - INTERVAL '14 days'
      GROUP BY dia
      ORDER BY dia
    `);

    // 4. Expedientes activos
    const expedientes = await pool.query(`
      SELECT nombre, apellido, carnet_uni, tipo_paciente, email, telefono, carrera_depto, creado_en
      FROM expedientes
      ORDER BY creado_en DESC
    `);

    // 5. Top medicamentos
    const medicamentos = await pool.query(`
      SELECT TRIM(UNNEST(string_to_array(medicamentos, E'\n'))) as medicamento, COUNT(*)::int as veces
      FROM consultas
      WHERE medicamentos IS NOT NULL AND medicamentos != ''
      GROUP BY medicamento
      ORDER BY veces DESC
      LIMIT 10
    `);

    // Crear libro
    const wb = xlsx.utils.book_new();

    // Agregar hojas
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(consultasPrioridad.rows), 'Consultas_Prioridad');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(stock.rows), 'Stock_Insumos');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(tendencia.rows), 'Tendencia_14d');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(expedientes.rows), 'Expedientes');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(medicamentos.rows), 'Top_Medicamentos');

    // Generar archivo
    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Headers para descarga
    res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Enfermeria.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error generando Excel:', err);
    res.status(500).json({ error: 'Error generando Excel' });
  }
});

export default router;