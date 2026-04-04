# Endpoints y API (resumen)

La aplicación cliente consume varios endpoints en `http://localhost:4001/api/...` (o la URL definida por `VITE_API_URL`). El cliente central está en `src/services/api.ts` pero el proyecto aún contiene llamadas con URL hardcodeadas en muchas páginas — es recomendable centralizarlas.

Base URL

- `VITE_API_URL` (en `.env.local`) — usado por `src/services/api.ts`.
- Fallback: `http://localhost:4001`.

Endpoints detectados (no exhaustivo, extraído del código):

Autenticación
- POST /api/auth/login — login (login.tsx usa axios.post)
- POST /api/auth/register — registro (registro.tsx usa axios.post)

Expedientes / Pacientes
- GET /api/expedientes — listado (expedientes/index.tsx)
- GET /api/expedientes/:id — obtener expediente por id (expedientes/index.tsx, historial.tsx)
- POST /api/expedientes — crear nuevo expediente (expedientes/nuevo-expediente.tsx)
- GET /api/expedientes/check?carnet=...&tipo=... — verificación (nueva-consulta/index.tsx)

Consultas
- POST /api/consultas — crear nueva consulta (nueva-consulta/index.tsx)
- GET /api/consultas?paciente_id=... — listar consultas por paciente (expedientes/historial.tsx)
- GET /api/consultas/:id — obtener detalles de consulta (expedientes/historial.tsx)
- GET /api/consultas-hoy — consultas programadas para hoy (consultas-hoy/index.tsx)

Inventario
- GET /api/inventario — listado de inventario (inventario/index.tsx, entrada.tsx, salida.tsx)
- POST /api/inventario — crear nuevo insumo (inventario/nuevo.tsx)
- POST /api/inventario/entrada — registrar entrada de insumos (inventario/entrada.tsx)
- POST /api/inventario/salida — registrar salida de insumos (inventario/salida.tsx)
- GET /api/inventario/:id — obtener item por id (inventario/index.tsx)
- GET /api/inventario/medicamentos — (expedientes/historial.tsx usa para sugerencias)

Reportes
- GET /api/reportes/consultas-por-prioridad
- GET /api/reportes/consultas-por-dia
- GET /api/reportes/stock-por-insumo
- GET /api/reportes/excel — endpoint que sirve un Excel (reportes/index.tsx abre esta URL en nueva pestaña)

Notas y recomendaciones

- Muchas páginas usan `fetch('http://localhost:4001/...')` con URL absolutas. Se sugiere:
  - Reemplazar esas llamadas por el cliente `api` de `src/services/api.ts` para respetar `VITE_API_URL` y centralizar headers/auth.
  - Añadir un interceptor en `src/services/api.ts` que inyecte `Authorization: Bearer <token>` si existe en `localStorage`.
  - Añadir manejo centralizado de errores (interceptor de respuesta) para unificar mensajes al usuario.

Ejemplo de interceptor (sugerido) en `src/services/api.ts`:

```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  return config;
});

api.interceptors.response.use((r) => r, (err) => {
  // transformar errores, log, mostrar notificaciones.
  return Promise.reject(err);
});
```

- Verificar que el backend soporta CORS desde el origen del frontend si lo sirve desde otra URL en desarrollo o producción.
