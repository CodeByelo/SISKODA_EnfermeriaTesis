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
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origen no permitido por CORS'));
    },
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

