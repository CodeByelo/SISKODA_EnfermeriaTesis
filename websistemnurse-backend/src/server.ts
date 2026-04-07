// src/server.ts
import express from 'express';
import cors from 'cors';
import consultasRouter from './routes';
import consultasHoyRouter from "./consultas-hoy";
import expedientesRouter from './expedientes';
import inventarioRouter from './inventario';
import reportesRouter from './reportes';
import 'dotenv/config';
import authRouter from './authRouter';

const app = express();
const PORT = process.env.PORT || 4001;
const normalizeOrigin = (value?: string) => value?.trim().replace(/\/$/, '');
const envOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean) as string[];
const allowedOrigins = [
  ...envOrigins,
  'http://localhost:5173',
  'http://localhost:4173',
  'https://siskoda-enfermeria-tesis.vercel.app',
].map((origin) => normalizeOrigin(origin) as string);
const allowedOriginPatterns = [/^https:\/\/.*\.vercel\.app$/];

app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowedByList =
        !!normalizedOrigin && allowedOrigins.includes(normalizedOrigin);
      const isAllowedByPattern =
        !!normalizedOrigin &&
        allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin));

      if (!origin || isAllowedByList || isAllowedByPattern) {
        callback(null, true);
        return;
      }

      callback(new Error('Origen no permitido por CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Monta los routers
app.use('/api/consultas', consultasRouter);        
app.use("/api/consultas-hoy", consultasHoyRouter);
app.use("/api/expedientes", expedientesRouter);
app.use("/api/inventario", inventarioRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Backend activo en puerto ${PORT}`);
});

