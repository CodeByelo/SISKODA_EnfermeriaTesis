import { Pool } from 'pg';
import dotenv from 'dotenv';

// Solo cargar .env si DATABASE_URL no está ya inyectado (ej. por dotenvx run) o está encriptado
if (!process.env.DATABASE_URL || String(process.env.DATABASE_URL).startsWith('encrypted:')) {
  dotenv.config();
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString || connectionString.startsWith('encrypted:')) {
  throw new Error('DATABASE_URL no configurada o aún encriptada. Ejecuta: npm run dev (usa dotenvx run) o define DATABASE_URL en .env sin encriptar.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false,
  max: 20, 
  idleTimeoutMillis: 60000, 
  connectionTimeoutMillis: 10000, 
  query_timeout: 30000, 
  statement_timeout: 30000, 
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL', err);
  process.exit(-1);
});

export default pool;