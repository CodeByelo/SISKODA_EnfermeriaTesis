import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db';

type AuthRequest = Request & {
  user?: {
    id: number;
    email: string;
    role: string;
  };
};

type JwtPayload = {
  id: number;
  email: string;
  role: string;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado');
  }

  return process.env.JWT_SECRET;
};

export const register = async (req: Request, res: Response) => {
  const { email, password, masterKey } = req.body;

  if (masterKey !== process.env.MASTER_KEY) {
    return res.status(403).json({ error: 'Clave maestra incorrecta' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role',
      [email, hashedPassword]
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

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT id, email, password, role FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role } });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesion' });
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
