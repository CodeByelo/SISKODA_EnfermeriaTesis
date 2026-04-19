import { Router } from 'express';
import pool from './db';
import type { AuthRequest } from './auth';
import { writeAuditLog } from './audit';

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

router.get('/history', async (_req, res) => {
  try {
    const auditTableCheck = await pool.query(`SELECT to_regclass('public.auditoria_accesos') as table_name`);
    const hasAuditTable = Boolean(auditTableCheck.rows[0]?.table_name);

    const consultasResult = await pool.query(
      `
        SELECT
          'consulta' as tipo,
          c.id as referencia_id,
          'consultas' as origen,
          c.creado_en as fecha,
          COALESCE(actor.email, 'Sin registro') as actor_email,
          COALESCE(actor.role::text, 'sin_rol') as actor_role,
          CONCAT_WS(' ', paciente.nombres, paciente.apellidos) as paciente_nombre,
          COALESCE(paciente.codigo_institucional, paciente.cedula, 'Sin identificador') as paciente_codigo,
          c.motivo as titulo,
          COALESCE((
            SELECT string_agg(cm.nombre_medicamento, ', ' ORDER BY cm.id)
            FROM consulta_medicamentos cm
            WHERE cm.consulta_id = c.id
          ), 'Sin medicamentos') as detalle,
          TRUE as eliminable
        FROM consultas c
        INNER JOIN expedientes e ON e.id = c.expediente_id
        INNER JOIN personas paciente ON paciente.id = e.persona_id
        LEFT JOIN usuarios actor ON actor.id = c.profesional_user_id
        ORDER BY c.creado_en DESC
        LIMIT 200
      `
    );

    const movimientosResult = await pool.query(
      `
        SELECT
          'inventario' as tipo,
          im.id as referencia_id,
          'inventario_movimientos' as origen,
          im.creado_en as fecha,
          COALESCE(actor.email, 'Sin registro') as actor_email,
          COALESCE(actor.role::text, 'sin_rol') as actor_role,
          CASE
            WHEN paciente.id IS NOT NULL THEN CONCAT_WS(' ', paciente.nombres, paciente.apellidos)
            ELSE 'Sin paciente asociado'
          END as paciente_nombre,
          COALESCE(paciente.codigo_institucional, paciente.cedula, 'Sin identificador') as paciente_codigo,
          CONCAT(
            CASE im.tipo_movimiento::text
              WHEN 'entrada' THEN 'Entrada de inventario'
              WHEN 'salida' THEN 'Salida de inventario'
              WHEN 'consumo_consulta' THEN 'Medicamento entregado en consulta'
              ELSE 'Movimiento de inventario'
            END,
            ': ',
            ii.nombre
          ) as titulo,
          CONCAT(
            'Cantidad: ',
            im.cantidad,
            ' | Stock: ',
            COALESCE(im.stock_anterior::text, '0'),
            ' -> ',
            COALESCE(im.stock_resultante::text, '0'),
            CASE WHEN im.motivo IS NOT NULL AND im.motivo <> '' THEN CONCAT(' | Motivo: ', im.motivo) ELSE '' END
          ) as detalle,
          CASE WHEN im.referencia_consulta_id IS NULL THEN TRUE ELSE FALSE END as eliminable
        FROM inventario_movimientos im
        INNER JOIN inventario_items ii ON ii.id = im.inventario_item_id
        LEFT JOIN usuarios actor ON actor.id = im.registrado_por_user_id
        LEFT JOIN consultas c ON c.id = im.referencia_consulta_id
        LEFT JOIN expedientes e ON e.id = c.expediente_id
        LEFT JOIN personas paciente ON paciente.id = e.persona_id
        ORDER BY im.creado_en DESC
        LIMIT 200
      `
    );

    const auditoriaRows = hasAuditTable
      ? await pool.query(
          `
            SELECT
              'auditoria' as tipo,
              aa.id as referencia_id,
              'auditoria_accesos' as origen,
              aa.creado_en as fecha,
              COALESCE(actor.email, 'Sin registro') as actor_email,
              COALESCE(actor.role::text, 'sin_rol') as actor_role,
              CASE
                WHEN paciente.id IS NOT NULL THEN CONCAT_WS(' ', paciente.nombres, paciente.apellidos)
                ELSE 'Sin paciente asociado'
              END as paciente_nombre,
              COALESCE(paciente.codigo_institucional, paciente.cedula, 'Sin identificador') as paciente_codigo,
              CONCAT(
                REPLACE(INITCAP(REPLACE(aa.accion, '_', ' ')), 'Auditoria ', ''),
                ' - ',
                INITCAP(aa.modulo)
              ) as titulo,
              COALESCE(aa.metadata::text, 'Sin detalle') as detalle,
              TRUE as eliminable
            FROM auditoria_accesos aa
            LEFT JOIN usuarios actor ON actor.id = aa.user_id
            LEFT JOIN personas paciente ON paciente.id = aa.persona_id
            ORDER BY aa.creado_en DESC
            LIMIT 200
          `
        )
      : { rows: [] as Array<Record<string, unknown>> };

    const history = [...consultasResult.rows, ...movimientosResult.rows, ...auditoriaRows.rows]
      .sort((a, b) => new Date(String(b.fecha)).getTime() - new Date(String(a.fecha)).getTime())
      .slice(0, 250);

    res.json(history);
  } catch (error) {
    console.error('Error obteniendo historial de usuarios:', error);
    res.status(500).json({ error: 'No se pudo cargar el historial' });
  }
});

router.delete('/history/:origen/:id', async (req: AuthRequest, res) => {
  const { origen, id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  try {
    if (origen === 'auditoria_accesos') {
      const result = await pool.query('DELETE FROM auditoria_accesos WHERE id = $1 RETURNING id', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }

      return res.status(204).send();
    }

    if (origen === 'consultas') {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const consulta = await client.query('SELECT id FROM consultas WHERE id = $1', [id]);
        if (consulta.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Consulta no encontrada' });
        }

        const medicamentos = await client.query(
          `
            SELECT inventario_item_id, cantidad
            FROM consulta_medicamentos
            WHERE consulta_id = $1
              AND inventario_item_id IS NOT NULL
          `,
          [id]
        );

        for (const row of medicamentos.rows) {
          await client.query(
            `
              UPDATE inventario_items
              SET stock_actual = COALESCE(stock_actual, 0) + $1
              WHERE id = $2
            `,
            [Number(row.cantidad ?? 0), row.inventario_item_id]
          );
        }

        await client.query('DELETE FROM inventario_movimientos WHERE referencia_consulta_id = $1', [id]);
        await client.query('DELETE FROM consulta_medicamentos WHERE consulta_id = $1', [id]);
        await client.query('DELETE FROM consultas WHERE id = $1', [id]);
        await client.query('COMMIT');

        return res.status(204).send();
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (origen === 'inventario_movimientos') {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const result = await client.query(
          `
            SELECT
              id,
              inventario_item_id,
              tipo_movimiento,
              cantidad,
              referencia_consulta_id
            FROM inventario_movimientos
            WHERE id = $1
            FOR UPDATE
          `,
          [id]
        );

        if (result.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Movimiento no encontrado' });
        }

        const movement = result.rows[0];

        if (movement.referencia_consulta_id) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Este movimiento proviene de una consulta. Elimina la consulta para retirarlo.' });
        }

        const stockResult = await client.query(
          'SELECT stock_actual FROM inventario_items WHERE id = $1 FOR UPDATE',
          [movement.inventario_item_id]
        );

        if (stockResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Insumo asociado no encontrado' });
        }

        const currentStock = Number(stockResult.rows[0].stock_actual ?? 0);
        const cantidad = Number(movement.cantidad ?? 0);
        let nextStock = currentStock;

        if (movement.tipo_movimiento === 'entrada') {
          nextStock = currentStock - cantidad;
        } else if (movement.tipo_movimiento === 'salida') {
          nextStock = currentStock + cantidad;
        } else {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Este tipo de movimiento no se puede eliminar desde esta vista' });
        }

        if (nextStock < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'No se puede eliminar este movimiento porque dejaria el stock en negativo' });
        }

        await client.query(
          'UPDATE inventario_items SET stock_actual = $1 WHERE id = $2',
          [nextStock, movement.inventario_item_id]
        );

        await client.query('DELETE FROM inventario_movimientos WHERE id = $1', [id]);
        await client.query('COMMIT');

        return res.status(204).send();
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    return res.status(400).json({ error: 'Origen no soportado para eliminar' });
  } catch (error) {
    console.error('Error eliminando registro de historial:', error);
    res.status(500).json({ error: 'No se pudo eliminar el registro' });
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
    const previous = await pool.query('SELECT id, email, role, persona_id FROM usuarios WHERE id = $1', [targetId]);
    if (previous.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const personaId = previous.rows[0].persona_id;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (role) {
      updates.push(`role = $${paramCount}::rol_usuario`);
      values.push(role);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(targetId);
    const result = await pool.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, role`,
      values
    );

    const portalRoles = ['estudiante', 'profesor', 'personal'];
    if (personaId && role && portalRoles.includes(role)) {
      await pool.query(
        'UPDATE personas SET tipo_miembro = $1::tipo_miembro WHERE id = $2',
        [role, personaId]
      );
    }
    
    if (personaId && email) {
      await pool.query(
        'UPDATE personas SET email = $1 WHERE id = $2',
        [email, personaId]
      );
    }

    await writeAuditLog({
      userId: req.user?.id ?? null,
      accion: 'usuario_actualizado',
      modulo: 'usuarios',
      recurso: String(targetId),
      metadata: {
        usuario_email: result.rows[0].email,
        rol_anterior: previous.rows[0]?.role ?? null,
        rol_nuevo: role ?? previous.rows[0]?.role,
        email_anterior: previous.rows[0]?.email,
        email_nuevo: email ?? previous.rows[0]?.email,
      },
    });

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
    const previous = await pool.query('SELECT id, email, role, persona_id FROM usuarios WHERE id = $1', [targetId]);
    const result = await pool.query(
      `
        DELETE FROM usuarios
        WHERE id = $1
        RETURNING id
      `,
      [targetId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (previous.rowCount && previous.rows[0]) {
      await writeAuditLog({
        userId: req.user?.id ?? null,
        personaId: previous.rows[0].persona_id ?? null,
        accion: 'usuario_eliminado',
        modulo: 'usuarios',
        recurso: String(targetId),
        metadata: {
          usuario_email: previous.rows[0].email,
          rol: previous.rows[0].role,
        },
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'No se pudo eliminar el usuario' });
  }
});

export default router;
