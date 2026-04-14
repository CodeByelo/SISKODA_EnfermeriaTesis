import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db';

export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: string;
    personaId?: string | null;
  };
};

type JwtPayload = {
  id: string;
  email: string;
  role: string;
  personaId?: string | null;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado');
  }

  return process.env.JWT_SECRET;
};

const sanitizeEmail = (value?: string) => value?.trim().toLowerCase();

export const register = async (req: Request, res: Response) => {
  const { email, password, masterKey } = req.body as {
    email?: string;
    password?: string;
    masterKey?: string;
  };

  if (masterKey !== process.env.MASTER_KEY) {
    return res.status(403).json({ error: 'Clave maestra incorrecta' });
  }

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Correo y contrasena son obligatorios' });
  }

  try {
    const normalizedEmail = sanitizeEmail(email);
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdPerson = await pool.query(
      `
        INSERT INTO personas (tipo_miembro, nombres, apellidos, correo_institucional, activo)
        VALUES ('interno', 'Administrador', 'Sistema', $1, TRUE)
        RETURNING id
      `,
      [normalizedEmail]
    );

    await pool.query(
      `
        INSERT INTO usuarios (email, password_hash, role, persona_id)
        VALUES ($1, $2, 'admin', $3)
      `,
      [normalizedEmail, hashedPassword, createdPerson.rows[0].id]
    );

    res.status(201).json({ message: 'Usuario registrado con exito' });
  } catch (err: unknown) {
    const error = err as { code?: string };

    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo ya esta registrado' });
    }

    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const registerPortal = async (req: Request, res: Response) => {
  const { identifier, password, email } = req.body as {
    identifier?: string;
    password?: string;
    email?: string;
  };

  if (!identifier?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Identificador y contrasena son obligatorios' });
  }

  try {
    const personResult = await pool.query(
      `
        SELECT *
        FROM personas
        WHERE activo = TRUE
          AND (
            cedula = $1
            OR codigo_institucional = $1
            OR LOWER(correo_institucional::text) = LOWER($1)
          )
        LIMIT 1
      `,
      [identifier.trim()]
    );

    if (personResult.rowCount === 0) {
      return res.status(404).json({ error: 'No existe una persona institucional con ese identificador' });
    }

    const person = personResult.rows[0];
    const normalizedEmail = sanitizeEmail(email) || sanitizeEmail(person.correo_institucional) || `${identifier.trim()}@portal.isum.local`;

    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 OR persona_id = $2 LIMIT 1',
      [normalizedEmail, person.id]
    );

    if ((existingUser.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta vinculada a esta persona' });
    }

    const roleMap: Record<string, string> = {
      estudiante: 'estudiante',
      profesor: 'profesor',
      personal: 'personal',
      interno: 'personal',
    };

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await pool.query(
      `
        INSERT INTO usuarios (email, password_hash, role, persona_id, estado_cuenta)
        VALUES ($1, $2, $3::rol_usuario, $4, 'activa')
        RETURNING id, email, role, persona_id
      `,
      [normalizedEmail, hashedPassword, roleMap[person.tipo_miembro] ?? 'personal', person.id]
    );

    res.status(201).json({
      message: 'Cuenta creada con exito',
      user: {
        id: created.rows[0].id,
        email: created.rows[0].email,
        role: created.rows[0].role,
        personaId: created.rows[0].persona_id,
      },
    });
  } catch (err: unknown) {
    const error = err as { code?: string };

    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo ya esta registrado' });
    }

    console.error('Error en registro portal:', err);
    res.status(500).json({ error: 'Error al registrar cuenta institucional' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  try {
    const normalizedEmail = sanitizeEmail(email);
    const user = await pool.query(
      `
        SELECT id, email, password_hash, role, persona_id, estado_cuenta
        FROM usuarios
        WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }

    if (user.rows[0].estado_cuenta !== 'activa') {
      return res.status(403).json({ error: 'Tu cuenta no esta activa' });
    }

    const validPassword = await bcrypt.compare(password ?? '', user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role,
        personaId: user.rows[0].persona_id,
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [user.rows[0].id]);

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role,
        personaId: user.rows[0].persona_id,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          u.id,
          u.email,
          u.role,
          u.persona_id,
          p.tipo_miembro,
          p.nombres,
          p.apellidos,
          p.correo_institucional
        FROM usuarios u
        LEFT JOIN personas p ON p.id = u.persona_id
        WHERE u.id = $1
      `,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      personaId: user.persona_id,
      tipo_miembro: user.tipo_miembro,
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo_institucional: user.correo_institucional,
    });
  } catch (error) {
    console.error('Error obteniendo sesion actual:', error);
    res.status(500).json({ error: 'No se pudo cargar la sesion' });
  }
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Error validando token:', err);
    return res.status(401).json({ error: 'Token invalido o vencido' });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta accion' });
    }

    next();
  };
};
