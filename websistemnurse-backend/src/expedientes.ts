// src/expedientes.ts
import { Router } from 'express';
import pool from './db';

const router = Router();

// GET / → devuelve todos los expedientes
router.get('/', async (_req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM expedientes ORDER BY creado_en DESC');
    res.json(rows.rows);
  } catch (err) {
    console.error('Error al obtener expedientes:', err);
    res.status(500).json({ error: 'Error al obtener expedientes' });
  }
});

// GET /:id → devuelve un expediente por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const idNum = parseInt(id, 10);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const result = await pool.query('SELECT * FROM expedientes WHERE id = $1', [idNum]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener expediente:', err);
    res.status(500).json({ error: 'Error al obtener el expediente' });
  }
});

// DELETE /:id → elimina un expediente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const idNum = parseInt(id, 10);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const result = await pool.query('DELETE FROM expedientes WHERE id = $1 RETURNING id', [idNum]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar expediente:', err);
    res.status(500).json({ error: 'Error al eliminar el expediente' });
  }
});

// ✅ NUEVA RUTA: /check para validar duplicados
router.get('/check', async (req, res) => {
  const { carnet, tipo } = req.query;
  if (!carnet || !tipo) return res.status(400).json({ error: 'Faltan parámetros' });

  const result = await pool.query(
    'SELECT id FROM expedientes WHERE carnet_uni = $1 AND tipo_paciente = $2',
    [carnet, tipo]
  );

  res.json({ exists: result.rows.length > 0 });
});

export default router;