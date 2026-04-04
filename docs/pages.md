# Páginas y navegación

Este documento describe las páginas encontradas en `src/pages/` y el propósito de cada una.

Estructura (resumen):

- `Home/` — `src/pages/Home/index.tsx` - Página principal (dashboard) con accesos rápidos.
- `Login/Registro/` — `src/pages/Login/Registro/login.tsx` y `registro.tsx` - Pantallas de login y registro de administradores.
  - `login.tsx` detecta 5 clics rápidos para navegar a `/register` (atajo) y guarda token en `localStorage` al iniciar sesión.
- `consultas-hoy/` — `src/pages/consultas-hoy/index.tsx` - Lista de consultas para el día.
- `nueva-consulta/` — `src/pages/nueva-consulta/index.tsx` - Formulario para crear una nueva consulta.
- `expedientes/` — `src/pages/expedientes/` - Gestión de expedientes con:
  - `index.tsx` - listado de expedientes
  - `nuevo-expediente.tsx` - formulario para crear expediente
  - `historial.tsx` - historial/consultas de un paciente
- `inventario/` — `src/pages/inventario/` - Gestión de inventario (entrada, salida, nuevo artículo)
  - `entrada.tsx`, `salida.tsx`, `nuevo.tsx`, `index.tsx`
- `reportes/` — `src/pages/reportes/index.tsx` - Visualización y exportación de reportes (gráficos y Excel)

Rutas y navegación

- La aplicación usa `useNavigate()` de `react-router-dom` en varias páginas. Algunas rutas encontradas en el código:
  - `/register` (registro)
  - `/dashboard` (destino tras login, revisar `app.tsx` para ruta exacta)
  - `/` (landing/home)

Recomendaciones

- Añadir un archivo `docs/routes.md` con un mapa de rutas y los roles/privilegios que cada ruta requiere (por ejemplo, rutas que requieren token).
- Validar que la navegación del cliente coincide con la configuración del router en `app.tsx` y que las rutas protegidas verifiquen `localStorage.getItem('token')` o un contexto de auth.
