# Documentación: `src/routes.ts`

Este documento describe el router principal definido en `src/routes.ts`. Contiene la lógica para crear consultas médicas, manejar expedientes y actualizar inventario (medicamentos).

## Resumen funcional

- Ruta base: `/` (el router se monta en `src/server.ts` en la ruta `/`, por lo que su ruta completa depende de cómo se use en `server.ts`).
- Transacciones: utiliza `BEGIN`/`COMMIT`/`ROLLBACK` para agrupar la creación de expediente, consulta y decremento de stock.

## Endpoints

1) POST /

Descripción: Crea o asocia un expediente y crea una consulta. Si se pasan `medicamentos`, por cada medicamento intenta decrementar 1 unidad de stock en la tabla `inventario`.

Body (JSON) — campos usados por el backend:

- `tipo_paciente` (string | opcional) — tipo del paciente (ej: 'estudiante', 'empleado').
- `carnet_uni` (string | opcional) — carnet universitario; se usa para evitar duplicados.
- `codigo_empleado` (string | opcional) — código del empleado; puede asociar a un expediente existente.
- `nombre` (string) — nombre del paciente (recomendado si se crea nuevo expediente).
- `apellido` (string) — apellido del paciente.
- `email`, `telefono`, `carrera`, `departamento`, `categoria`, `cargo` — datos opcionales del expediente.
- `motivo` (string) — motivo de la consulta. Requerido.
- `sintomas` (string) — texto libre.
- `diagnostico` (string)
- `medicamentos` (string con saltos de línea o array) — lista de nombres de medicamentos. Si se provee, por cada ítem se busca en `inventario` (comparación case-insensitive) y se decrementa `stock_actual` en 1.
- `notas_recom` (string)
- `prioridad` (string|number) — prioridad de la consulta. Requerido.
- `paciente_id` (number | opcional) — si ya existe un expediente en frontend, puede pasarse para saltarse la creación.

Respuestas típicas:
- 201 — `{ message: 'Consulta creada exitosamente', id: <consultaId> }` cuando todo va bien.
- 400 — Bad request (p. ej. faltan campos obligatorios, medicamento no encontrado o stock insuficiente).
- 409 — conflicto si ya existe un paciente con mismo `carnet_uni` y `tipo_paciente` cuando se intenta crear uno nuevo.
- 500 — error interno del servidor.

Ejemplo cURL (creación simple):

```bash
curl -X POST http://localhost:4001/api/consultas \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_paciente":"estudiante",
    "carnet_uni":"20201234",
    "nombre":"Juan",
    "apellido":"Pérez",
    "motivo":"Dolor de cabeza",
    "prioridad":"media"
  }'
```

Ejemplo cURL (con medicamentos, reduce stock):

```bash
curl -X POST http://localhost:4001/api/consultas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre":"Ana",
    "apellido":"Gomez",
    "motivo":"Tos",
    "prioridad":"alta",
    "medicamentos":"Paracetamol\nIbuprofeno"
  }'
```

2) GET /

Descripción: Lista consultas de un paciente. Requiere query `paciente_id`.

Query params:
- `paciente_id` (number) — id del expediente.

Respuesta:
- 200 — array de consultas con campos `{ id, motivo, sintomas, diagnostico, medicamentos, notas_recom, prioridad, creado_en }`.

3) DELETE /:id

Descripción: Elimina una consulta por ID.

Parámetros de ruta:
- `id` (number) — id de la consulta a eliminar.

Respuestas:
- 204 — eliminado con éxito.
- 404 — si no existe la consulta.

## Supuestos y notas técnicas

- Las tablas `expedientes`, `consultas` e `inventario` deben existir con las columnas utilizadas en las consultas SQL.
- Cuando se proporcionan `medicamentos`, se espera que los nombres coincidan (insensitive) con el campo `nombre` en `inventario`.
- El decremento de stock resta 1 unidad por medicamento listado; si quieres soporte de cantidades por medicamento, habría que extender el esquema del body.

## Mejoras sugeridas

- Validaciones más estrictas (p. ej. `zod` o `joi`) para el body.
- Soporte para cantidades por medicamento (actualmente resta 1 por entrada).
- Endpoints para reembolsos o devolución de stock si se elimina una consulta que ya consumió insumos.
- Tests unitarios e integración para flujos transaccionales.
