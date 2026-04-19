import { Router } from 'express';
import pool from './db';
import type { AuthRequest } from './auth';

const router = Router();

const portalRoles = ['estudiante', 'profesor', 'personal'];

router.get('/me/profile', async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          u.id as user_id,
          u.email,
          u.role,
          u.estado_cuenta,
          u.ultimo_acceso,
          p.id as persona_id,
          p.tipo_miembro,
          p.cedula,
          p.codigo_institucional,
          p.nombres,
          p.apellidos,
          p.correo_institucional,
          p.telefono,
          p.carrera_depto,
          p.categoria,
          p.cargo,
          p.lapso,
          p.fecha_vencimiento_carnet,
          p.activo,
          e.id as expediente_id,
          e.visibilidad_paciente
        FROM usuarios u
        LEFT JOIN personas p ON p.id = u.persona_id
        LEFT JOIN expedientes e ON e.persona_id = p.id
        WHERE u.id = $1
        LIMIT 1
      `,
      [req.user.id]
    );

    const profile = result.rows[0];

    // Sincronización de roles: si el rol de usuario no coincide con el tipo de miembro, lo actualizamos.
    const roleMap: Record<string, string> = {
      estudiante: 'estudiante',
      profesor: 'profesor',
      personal: 'personal',
      interno: 'personal',
    };

    const correctRole = roleMap[profile.tipo_miembro] || 'personal';
    if (profile.role !== correctRole) {
      try {
        await pool.query('UPDATE usuarios SET role = $1::rol_usuario WHERE id = $2', [correctRole, profile.user_id]);
        profile.role = correctRole; // Actualizar en el objeto de respuesta
      } catch (err) {
        console.error('Error sincronizando rol de usuario:', err);
      }
    }

    res.json(profile);
  } catch (error) {
    console.error('Error obteniendo perfil del portal:', error);
    res.status(500).json({ error: 'No se pudo cargar el perfil' });
  }
});

router.get('/me/history', async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  const personaId = req.user.personaId;
  const { persona_id: queryPersonaId } = req.query;
  const targetPersonaId = queryPersonaId ? String(queryPersonaId) : personaId;

  if (!targetPersonaId) {
    return res.status(400).json({ error: 'persona_id es requerido' });
  }

  try {
    const historyQuery = `
      SELECT
        c.id,
        c.creado_en,
        c.prioridad,
        c.motivo,
        c.sintomas,
        c.diagnostico,
        (
          SELECT string_agg(cm.nombre_medicamento, E'\n' ORDER BY cm.id)
          FROM consulta_medicamentos cm
          WHERE cm.consulta_id = c.id
        ) as medicamentos,
        c.notas_recomendacion as notas_recom,
        e.id as expediente_id,
        p.id as persona_id,
        p.nombres,
        p.apellidos,
        p.tipo_miembro
      FROM personas p
      INNER JOIN expedientes e ON e.persona_id = p.id
      INNER JOIN consultas c ON c.expediente_id = e.id
      WHERE p.id = $1::uuid OR p.id::text = $1
      ORDER BY c.creado_en DESC
    `;

    const result = await pool.query(historyQuery, [targetPersonaId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo historial personal:', error);
    res.status(500).json({ error: 'No se pudo cargar el historial' });
  }
});

export default router;
