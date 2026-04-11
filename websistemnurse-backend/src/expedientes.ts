import { Router } from 'express';
import pool from './db';

const router = Router();

router.get('/check', async (req, res) => {
  const { carnet, tipo } = req.query;
  if (!carnet || !tipo) {
    return res.status(400).json({ error: 'Faltan parametros' });
  }

  const result = await pool.query(
    'SELECT id FROM expedientes WHERE carnet_uni = $1 AND tipo_paciente = $2',
    [carnet, tipo]
  );

  res.json({ exists: result.rows.length > 0 });
});

router.get('/', async (_req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM expedientes ORDER BY creado_en DESC');
    res.json(rows.rows);
  } catch (err) {
    console.error('Error al obtener expedientes:', err);
    res.status(500).json({ error: 'Error al obtener expedientes' });
  }
});

router.post('/', async (req, res) => {
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

  try {
    if (carnet_uni) {
      const existingCarnet = await pool.query(
        'SELECT id FROM expedientes WHERE carnet_uni = $1 AND tipo_paciente = $2',
        [carnet_uni, tipo_paciente]
      );

      if ((existingCarnet.rowCount ?? 0) > 0) {
        return res.status(409).json({ error: 'Ya existe un expediente con ese carnet' });
      }
    }

    if (codigo_empleado) {
      const existingCodigo = await pool.query(
        'SELECT id FROM expedientes WHERE codigo_empleado = $1 AND tipo_paciente = $2',
        [codigo_empleado, tipo_paciente]
      );

      if ((existingCodigo.rowCount ?? 0) > 0) {
        return res.status(409).json({ error: 'Ya existe un expediente con ese codigo de empleado' });
      }
    }

    const result = await pool.query(
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
      RETURNING *`,
      [
        tipo_paciente,
        carnet_uni || null,
        codigo_empleado || null,
        nombre.trim(),
        apellido.trim(),
        email || null,
        telefono || null,
        carrera_depto || null,
        categoria || null,
        cargo || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear expediente:', err);
    res.status(500).json({ error: 'Error al crear expediente' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const idNum = parseInt(id, 10);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID invalido' });
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

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const idNum = parseInt(id, 10);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID invalido' });
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

export default router;
