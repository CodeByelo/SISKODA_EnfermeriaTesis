# websistemnurse-Frontend

Repositorio frontend de la aplicación ISUM — React + TypeScript + Vite + Tailwind CSS.

Esta carpeta contiene la aplicación cliente y la documentación en `docs/`.

En este README encontrarás un resumen rápido y enlaces a la documentación detallada.

Enlaces rápidos

- Documentación completa: `docs/README.md`
- Cómo ejecutar el proyecto: `docs/run.md`
- Estructura y páginas: `docs/pages.md`
- Componentes principales: `docs/components.md`
- Endpoints/API: `docs/endpoints.md`
- Guía de contribución: `docs/contributing.md`

Stack y dependencias clave

- React 19 + TypeScript
- Vite (con override `rolldown-vite` en package.json)
- Tailwind CSS para utilidades de estilos
- Axios para cliente HTTP
- Chart.js, react-chartjs-2, exceljs, xlsx y file-saver para reportes/export

Archivos de interés

- `src/main.tsx`, `src/app.tsx` — punto de entrada y configuración de rutas/layout
- `src/services/api.ts` — cliente Axios central
- `src/pages/` — páginas por funcionalidad (consultas, expedientes, inventario, reportes, login)
- `src/components/` — componentes reutilizables (LiquidEther, DashboardButtons, etc.)

Contacto

Si quieres que amplíe la documentación (ejemplos de props, diagramas, o una guía de despliegue específica para Vercel/Netlify/Docker), dime la prioridad y lo agrego.
