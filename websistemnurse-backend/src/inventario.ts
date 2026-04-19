import { Router } from 'express';
import pool from './db';
import type { AuthRequest } from './auth';
import { writeAuditLog } from './audit';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const rows = await pool.query(`
      SELECT
        ii.id,
        ii.nombre,
        ii.categoria,
        COALESCE(ii.stock_actual, 0) as stock_actual,
        COALESCE(ii.stock_minimo, 0) as stock_minimo,
        MIN(il.fecha_vencimiento) as fecha_vencimiento,
        STRING_AGG(DISTINCT il.lote, ', ') FILTER (WHERE il.lote IS NOT NULL) as lote,
        ii.unidad_medida,
        CASE
          WHEN COALESCE(ii.stock_actual, 0) <= COALESCE(ii.stock_minimo, 0) THEN 'Bajo stock'
          WHEN MIN(il.fecha_vencimiento) IS NOT NULL AND MIN(il.fecha_vencimiento) < CURRENT_DATE THEN 'Vencido'
          ELSE 'Normal'
        END as estado
      FROM inventario_items ii
      LEFT JOIN inventario_lotes il ON il.inventario_item_id = ii.id
      GROUP BY ii.id, ii.nombre, ii.categoria, ii.stock_actual, ii.stock_minimo, ii.unidad_medida
      ORDER BY ii.nombre ASC
    `);
    res.json(rows.rows);
  } catch (err) {
    console.error('Error al obtener inventario:', err);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

router.get('/medicamentos', async (_req, res) => {
  try {
    const rows = await pool.query(`
      SELECT
        id,
        nombre,
        COALESCE(stock_actual, 0) as cantidad_disponible
      FROM inventario_items
      WHERE COALESCE(stock_actual, 0) > 0
        AND activo = TRUE
      ORDER BY nombre ASC
    `);
    res.json(rows.rows);
  } catch (err) {
    console.error('Error al obtener medicamentos:', err);
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
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
      `
        INSERT INTO inventario_items (
          nombre,
          descripcion,
          categoria,
          stock_minimo,
          unidad_medida,
          stock_actual
        ) VALUES ($1, $2, $3, $4, $5, 0)
        RETURNING *
      `,
      [
        nombre.trim(),
        descripcion?.trim() || null,
        categoria?.trim() || null,
        Number(stock_minimo) || 5,
        unidad_medida || 'unidades',
      ]
    );

    if (lote || fecha_vencimiento) {
      await pool.query(
        `
          INSERT INTO inventario_lotes (
            inventario_item_id,
            lote,
            fecha_vencimiento,
            stock_lote
          ) VALUES ($1, $2, $3, 0)
        `,
        [result.rows[0].id, lote || null, fecha_vencimiento || null]
      );
    }

    await writeAuditLog({
      userId: req.user?.id ?? null,
      accion: 'insumo_creado',
      modulo: 'inventario',
      recurso: String(result.rows[0].id),
      metadata: {
        nombre: result.rows[0].nombre,
        categoria: result.rows[0].categoria ?? null,
        unidad_medida: result.rows[0].unidad_medida,
        stock_minimo: result.rows[0].stock_minimo,
      },
    });

    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un insumo con ese nombre' });
    }
    console.error('Error al crear insumo:', err);
    res.status(500).json({ error: 'Error al crear el insumo' });
  }
});

router.post('/entrada', async (req: AuthRequest, res) => {
  const { insumo_id, cantidad, lote, fecha_vencimiento, notas } = req.body;
  const cantidadNum = Number(cantidad);

  if (!insumo_id || !Number.isFinite(cantidadNum) || cantidadNum <= 0) {
    return res.status(400).json({ error: 'Insumo y cantidad valida son obligatorios' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const current = await client.query(
      'SELECT stock_actual FROM inventario_items WHERE id = $1 FOR UPDATE',
      [insumo_id]
    );

    if (current.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const stockAnterior = Number(current.rows[0].stock_actual ?? 0);
    const stockResultante = stockAnterior + cantidadNum;

    const result = await client.query(
      `
        UPDATE inventario_items
        SET stock_actual = $1
        WHERE id = $2
        RETURNING *
      `,
      [stockResultante, insumo_id]
    );

    let loteId: number | null = null;
    if (lote || fecha_vencimiento) {
      const loteResult = await client.query(
        `
          INSERT INTO inventario_lotes (
            inventario_item_id,
            lote,
            fecha_vencimiento,
            stock_lote
          ) VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
        [insumo_id, lote || null, fecha_vencimiento || null, cantidadNum]
      );
      loteId = loteResult.rows[0].id;
    }

    await client.query(
      `
        INSERT INTO inventario_movimientos (
          inventario_item_id,
          inventario_lote_id,
          tipo_movimiento,
          cantidad,
          stock_anterior,
          stock_resultante,
          motivo,
          registrado_por_user_id
        ) VALUES ($1, $2, 'entrada', $3, $4, $5, $6, $7)
      `,
      [
        insumo_id,
        loteId,
        cantidadNum,
        stockAnterior,
        stockResultante,
        typeof notas === 'string' && notas.trim() ? notas.trim() : 'Entrada manual de inventario',
        req.user?.id ?? null,
      ]
    );

    await client.query('COMMIT');
    res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al registrar entrada:', err);
    res.status(500).json({ error: 'Error al registrar la entrada' });
  } finally {
    client.release();
  }
});

router.post('/salida', async (req: AuthRequest, res) => {
  const { insumo_id, cantidad, motivo, notas } = req.body;
  const cantidadNum = Number(cantidad);

  if (!insumo_id || !Number.isFinite(cantidadNum) || cantidadNum <= 0) {
    return res.status(400).json({ error: 'Insumo y cantidad valida son obligatorios' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const check = await client.query(
      'SELECT stock_actual FROM inventario_items WHERE id = $1 FOR UPDATE',
      [insumo_id]
    );

    if (check.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const stockActual = Number(check.rows[0].stock_actual ?? 0);

    if (stockActual < cantidadNum) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const stockResultante = stockActual - cantidadNum;

    const result = await client.query(
      `
        UPDATE inventario_items
        SET stock_actual = $1
        WHERE id = $2
        RETURNING *
      `,
      [stockResultante, insumo_id]
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
          registrado_por_user_id
        ) VALUES ($1, 'salida', $2, $3, $4, $5, $6)
      `,
      [
        insumo_id,
        cantidadNum,
        stockActual,
        stockResultante,
        [motivo, notas]
          .filter((value) => typeof value === 'string' && value.trim())
          .join(' - ') || 'Salida manual de inventario',
        req.user?.id ?? null,
      ]
    );

    await client.query('COMMIT');
    res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al registrar salida:', err);
    res.status(500).json({ error: 'Error al registrar la salida' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  try {
    const check = await pool.query('SELECT id, stock_actual FROM inventario_items WHERE id = $1', [id]);
    const itemInfo = await pool.query('SELECT nombre, categoria FROM inventario_items WHERE id = $1', [id]);

    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    if ((check.rows[0].stock_actual || 0) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un insumo con stock > 0' });
    }

    await pool.query('DELETE FROM inventario_items WHERE id = $1', [id]);

    if (itemInfo.rowCount && itemInfo.rows[0]) {
      await writeAuditLog({
        userId: (req as AuthRequest).user?.id ?? null,
        accion: 'insumo_eliminado',
        modulo: 'inventario',
        recurso: String(id),
        metadata: {
          nombre: itemInfo.rows[0].nombre,
          categoria: itemInfo.rows[0].categoria ?? null,
        },
      });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar insumo:', err);
    res.status(500).json({ error: 'Error al eliminar el insumo' });
  }
});

export default router;
