// src/inventario.ts
import { Router } from 'express';
import pool from './db';

const router = Router();

// GET /api/inventario → Para la tabla de inventario (muestra todos)
router.get('/', async (_req, res) => {
  try {
    const rows = await pool.query(`
      SELECT 
        id, 
        nombre, 
        categoria,
        COALESCE(stock_actual, 0) as stock_actual,
        COALESCE(stock_minimo, 0) as stock_minimo,
        fecha_vencimiento,
        lote,
        unidad_medida,
        CASE 
          WHEN COALESCE(stock_actual, 0) <= COALESCE(stock_minimo, 0) THEN 'Bajo stock'
          WHEN fecha_vencimiento IS NOT NULL AND fecha_vencimiento < CURRENT_DATE THEN 'Vencido'
          ELSE 'Normal'
        END as estado
      FROM inventario 
      ORDER BY nombre ASC
    `);
    res.json(rows.rows);
  } catch (err) {
    console.error('Error al obtener inventario:', err);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// GET /api/inventario/medicamentos → Para el select en "Agregar nueva historia"
router.get('/medicamentos', async (_req, res) => {
  try {
    const rows = await pool.query(`
      SELECT 
        id, 
        nombre, 
        COALESCE(stock_actual, 0) as cantidad_disponible
      FROM inventario 
      WHERE COALESCE(stock_actual, 0) > 0 
      ORDER BY nombre ASC
    `);
    res.json(rows.rows);
  } catch (err) {
    console.error('Error al obtener medicamentos:', err);
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
});

// POST /api/inventario → crea un nuevo insumo
router.post('/', async (req, res) => {
  const {
    nombre,
    descripcion,
    categoria,
    stock_minimo,
    unidad_medida,
    lote,
    fecha_vencimiento
  } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO inventario (
        nombre,
        descripcion,
        categoria,
        stock_minimo,
        unidad_medida,
        lote,
        fecha_vencimiento,
        stock_actual
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
      RETURNING *`,
      [
        nombre.trim(),
        descripcion?.trim() || null,
        categoria?.trim() || null,
        Number(stock_minimo) || 5,
        unidad_medida || 'unidades',
        lote || null,
        fecha_vencimiento || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Error desconocido');
    if (error.message.includes('unique constraint')) {
      return res.status(409).json({ error: 'Ya existe un insumo con ese nombre' });
    }
    console.error('Error al crear insumo:', err);
    res.status(500).json({ error: 'Error al crear el insumo' });
  }
});

// POST /api/inventario/entrada → registra entrada de stock
router.post('/entrada', async (req, res) => {
  const { insumo_id, cantidad, lote, fecha_vencimiento } = req.body;

  if (!insumo_id || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Insumo y cantidad válida son obligatorios' });
  }

  try {
    const result = await pool.query(
      `UPDATE inventario
       SET
         stock_actual = COALESCE(stock_actual, 0) + $1,
         lote = $2,
         fecha_vencimiento = $3,
         actualizado_en = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        Number(cantidad),
        lote || null,
        fecha_vencimiento || null,
        Number(insumo_id)
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error al registrar entrada:', err);
    res.status(500).json({ error: 'Error al registrar la entrada' });
  }
});

// POST /api/inventario/salida → registra salida de stock
router.post('/salida', async (req, res) => {
  const { insumo_id, cantidad } = req.body;

  if (!insumo_id || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Insumo y cantidad válida son obligatorios' });
  }

  const cantidadNum = Number(cantidad);
  const insumoIdNum = Number(insumo_id);

  try {
    const check = await pool.query('SELECT stock_actual FROM inventario WHERE id = $1', [insumoIdNum]);

    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const stockActual = check.rows[0].stock_actual || 0;

    if (stockActual < cantidadNum) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const result = await pool.query(
      `UPDATE inventario
       SET
         stock_actual = stock_actual - $1,
         actualizado_en = NOW()
       WHERE id = $2
       RETURNING *`,
      [cantidadNum, insumoIdNum]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error al registrar salida:', err);
    res.status(500).json({ error: 'Error al registrar la salida' });
  }
});

// DELETE /api/inventario/:id → elimina un insumo (solo si stock = 0)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const idNum = Number(id);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const check = await pool.query('SELECT id, stock_actual FROM inventario WHERE id = $1', [idNum]);

    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    if ((check.rows[0].stock_actual || 0) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un insumo con stock > 0' });
    }

    await pool.query('DELETE FROM inventario WHERE id = $1', [idNum]);
    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar insumo:', err);
    res.status(500).json({ error: 'Error al eliminar el insumo' });
  }
});

export default router;
