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

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo perfil del portal:', error);
    res.status(500).json({ error: 'No se pudo cargar el perfil' });
  }
});

router.get('/me/history', async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  const isPortalUser = portalRoles.includes(req.user.role);
  const userId = req.user.id;
  const { persona_id } = req.query;
  const targetPersonaId = persona_id ? Number(persona_id) : null;

  if (!isPortalUser && !targetPersonaId) {
    return res.status(400).json({ error: 'persona_id es requerido para usuarios internos' });
  }

  try {
    const historyQuery = isPortalUser
      ? `
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
          FROM usuarios u
          INNER JOIN personas p ON p.id = u.persona_id
          INNER JOIN expedientes e ON e.persona_id = p.id
          INNER JOIN consultas c ON c.expediente_id = e.id
          WHERE u.id = $1
          ORDER BY c.creado_en DESC
        `
      : `
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
          WHERE p.id = $1
          ORDER BY c.creado_en DESC
        `;

    const result = await pool.query(historyQuery, [isPortalUser ? userId : targetPersonaId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo historial personal:', error);
    res.status(500).json({ error: 'No se pudo cargar el historial' });
  }
});

export default router;
