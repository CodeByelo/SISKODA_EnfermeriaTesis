# Cómo ejecutar el proyecto (desarrollo y producción)

Requisitos

- Node.js 18+ (recomendado)
- npm (incluido con Node) o pnpm/yarn

Instalación (PowerShell)

```powershell
cd c:\Users\USR\Desktop\websistemnurse-Frontend
npm install
```

Variables de entorno

- Crea `.env.local` en la raíz con al menos:

```
VITE_API_URL=http://localhost:4001
```

Scripts disponibles (ver `package.json`):

- `npm run dev` — iniciar servidor de desarrollo (Vite). Abre http://localhost:5173/ por defecto.
- `npm run build` — compila TypeScript y genera la build de producción (carpeta `dist`).
- `npm run preview` — vista previa del build local.
- `npm run lint` — ejecuta ESLint.

Arrancar en desarrollo

```powershell
npm run dev
```

Compilar para producción

```powershell
npm run build
npm run preview
```

Problemas comunes

- "'vite' no se reconoce" — significa que las dependencias no están instaladas o la instalación falló: ejecutar `npm install` y volver a intentar.
- Errores de CORS cuando el frontend hace peticiones a la API: habilitar CORS en el backend o usar un proxy en `vite.config.ts` durante desarrollo.
- Error de TypeScript en compilación: revisar `tsconfig.app.json` y las versiones de tipos en `devDependencies`.

Probar la app

- Abre `http://localhost:5173/` en el navegador tras `npm run dev`.
- Usa las pantallas `Login`/`Registro` para probar autenticación (backend corriendo en `VITE_API_URL`).

Comprobaciones rápidas

- Asegúrate de que el backend esté corriendo en la URL configurada por `VITE_API_URL`.
- Verifica la consola del navegador para errores JS y la pestaña `Network` para ver si las llamadas a `/api/*` retornan 2xx.
