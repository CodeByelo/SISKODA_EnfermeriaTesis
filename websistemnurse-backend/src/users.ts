import { Router } from 'express';
import pool from './db';
import type { AuthRequest } from './auth';

const router = Router();

const allowedRoles = ['admin', 'enfermeria', 'consulta', 'inventario', 'reportes', 'estudiante', 'profesor', 'personal'];

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          u.id,
          u.email,
          u.role,
          u.estado_cuenta,
          p.nombres,
          p.apellidos,
          p.tipo_miembro
        FROM usuarios u
        LEFT JOIN personas p ON p.id = u.persona_id
        ORDER BY u.email ASC
      `
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'No se pudieron cargar los usuarios' });
  }
});

router.patch('/:id/role', async (req: AuthRequest, res) => {
  const targetId = req.params.id;
  const { role } = req.body as { role?: string };

  if (!targetId) {
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
      'UPDATE usuarios SET role = $1::rol_usuario WHERE id = $2::uuid RETURNING id, email, role',
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

router.delete('/:id', async (req: AuthRequest, res) => {
  const targetId = req.params.id;

  if (!targetId) {
    return res.status(400).json({ error: 'ID de usuario invalido' });
  }

  if (req.user?.id === targetId) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde esta pantalla' });
  }

  try {
    const result = await pool.query(
      `
        DELETE FROM usuarios
        WHERE id = $1::uuid
        RETURNING id
      `,
      [targetId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'No se pudo eliminar el usuario' });
  }
});

export default router;
