# Componentes principales

Este archivo documenta los componentes reutilizables que hay en `src/components/`.

1) `LiquidEther` — `src/components/LiquidEther.tsx`
- Componente que implementa un fondo/efecto WebGL (Three.js).
- Props principales: `colors`, `mouseForce`, `cursorSize`, `isViscous`, `resolution`, `autoDemo`, `autoSpeed`, `autoIntensity`, `autoResumeDelay`, `autoRampDuration`, `takeoverDuration`.
- Uso: se monta como fondo en pantallas de Login/Registro. Se recomienda pasar `pointer-events: none` (ya viene configurado en el componente) cuando se usa como fondo.
- Notas: usa muchas APIs WebGL y gestiona recursos (dispose, resize). Evitar múltiples instancias simultáneas en la misma vista.

2) `DashboardButtons` — `src/components/DashboardButtons.tsx`
- Botones fijos en el dashboard que abren enlaces externos.
- Props: actualmente no recibe props, lista `items` en el componente. Puedes parametrizar para permitir agregar elementos desde el padre.
- Observaciones de accesibilidad: usa `aria-label` en botones.

3) `GlassIcons` — `src/components/GlassIcons.tsx`
- Colección de iconos/elementos gráficos (reutilizables en el UI).

Cómo documentar un nuevo componente

- Añade un archivo `docs/components/<nombre>.md` si el componente tiene comportamiento complejo o props numerosas.
- Incluye: props (con tipos), ejemplos de uso, notas de rendimiento, y pruebas/unit tests sugeridos.

Sugerencias de mejora

- Añadir Storybook para documentar visualmente los componentes y sus estados.
- Extraer listas de elementos estáticos (como `items` en `DashboardButtons`) a una prop o a un archivo de configuración para facilitar testing y traducción.
