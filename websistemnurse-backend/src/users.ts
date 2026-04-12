import { Router } from 'express';
import pool from './db';
import type { AuthRequest } from './auth';

const router = Router();

const allowedRoles = ['admin', 'enfermeria', 'consulta', 'inventario', 'reportes'];

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role FROM users ORDER BY email ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'No se pudieron cargar los usuarios' });
  }
});

router.patch('/:id/role', async (req: AuthRequest, res) => {
  const targetId = Number(req.params.id);
  const { role } = req.body as { role?: string };

  if (!Number.isInteger(targetId)) {
    return res.status(400).json({ error: 'ID de usuario invalido' });
  }

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Rol invalido' });
  }

  if (req.user?.id === targetId && role !== 'admin') {
    return res.status(400).json({ error: 'No puedes quitarte el rol de administrador desde esta pantalla' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [role, targetId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'No se pudo actualizar el rol' });
  }
});

export default router;
