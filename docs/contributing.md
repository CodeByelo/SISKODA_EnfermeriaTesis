# Guía de contribución y convenciones

Convenciones de código

- TypeScript: usar tipos y mantener `types.ts` por dominio (por ejemplo, `expedientes/types.ts`).
- Componentes: `.tsx` para componentes React. Mantener lógica y presentación separadas cuando sea posible.
- Estilos: usar utilidades de Tailwind en las clases. Añadir clases CSS solo cuando sea necesario.

Lint y formateo

- Ejecuta `npm run lint` antes de abrir un PR.
- Añadir reglas en `eslint.config.js` si se requieren reglas específicas.

Branches y PRs

- Ramas: `feature/<descripcion>`, `fix/<descripcion>`, `chore/<descripcion>`.
- Incluye en el PR:
  - Descripción del cambio
  - Pasos para probar localmente
  - Capturas de pantalla si aplica

Testing

- Actualmente no hay tests en el repo. Recomendación: añadir `vitest` (unit tests) y `msw` para mockear API en tests.

Mejoras sugeridas

- Añadir CI (GitHub Actions) que ejecute `npm ci`, `npm run lint`, y `npm run build`.
- Añadir Storybook para documentar componentes visualmente.
- Centralizar todas las llamadas HTTP en `src/services/api.ts` y usar interceptores para auth y manejo de errores.
