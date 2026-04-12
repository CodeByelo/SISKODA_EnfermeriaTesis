# websistemnurse-Frontend

Repositorio frontend de la aplicacion ISUM con React, TypeScript, Vite y Tailwind CSS.

Esta carpeta contiene la aplicacion cliente y la documentacion en `docs/`.

En este README encontraras un resumen rapido y enlaces a la documentacion detallada.

Enlaces rapidos

- Documentacion completa: `docs/README.md`
- Como ejecutar el proyecto: `docs/run.md`
- Estructura y paginas: `docs/pages.md`
- Componentes principales: `docs/components.md`
- Endpoints/API: `docs/endpoints.md`
- Rediseno de base de datos: `docs/database-redesign.md`
- SQL del esquema nuevo para Supabase: `docs/sql/esquema_nuevo_supabase.sql`
- Portal personal, identidad y seguimiento: `docs/portal-identidad-seguimiento.md`
- Guia de contribucion: `docs/contributing.md`

Stack y dependencias clave

- React 19 + TypeScript
- Vite con override `rolldown-vite` en `package.json`
- Tailwind CSS para utilidades de estilos
- Axios para cliente HTTP
- Chart.js, react-chartjs-2, exceljs, xlsx y file-saver para reportes/export

Archivos de interes

- `src/main.tsx`, `src/app.tsx`: punto de entrada y configuracion de rutas/layout
- `src/services/api.ts`: cliente Axios central
- `src/pages/`: paginas por funcionalidad como consultas, expedientes, inventario, reportes y login
- `src/components/`: componentes reutilizables como `LiquidEther` y `DashboardButtons`

Contacto

Si quieres que amplie la documentacion con ejemplos de props, diagramas o una guia de despliegue especifica para Vercel, Netlify o Docker, dime la prioridad y lo agrego.
