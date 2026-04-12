# Rediseno De Base De Datos

## Base actual

El esquema actual tiene cuatro tablas principales:

- `users`
- `expedientes`
- `consultas`
- `inventario`

Ese modelo funciona para una version interna del sistema, pero se queda corto para:

- cuentas institucionales para estudiantes, profesores y personal
- trazabilidad de accesos
- relacion formal entre cuenta, persona y expediente
- control correcto de medicamentos usados por consulta
- historial de movimientos de inventario

## Problemas detectados

### 1. identidad mezclada con expediente

Hoy `expedientes` guarda datos de identidad de la persona y al mismo tiempo representa el expediente clinico.

Eso hace dificil:

- enlazar una cuenta de usuario con una persona real
- tener varios contextos de uso para la misma persona
- separar identidad institucional de informacion clinica

### 2. users sin enlace con persona

`users` tiene:

- `id`
- `email`
- `password`
- `role`

Pero no sabe a quien pertenece la cuenta dentro del instituto.

### 3. consultas guarda medicamentos como texto

`consultas.medicamentos` es texto libre. Eso impide:

- saber cantidades reales usadas
- relacionar consumo con inventario
- auditar insumos consumidos por consulta

### 4. inventario sin bitacora de movimientos

La tabla `inventario` guarda el stock actual, pero no el historial de:

- entradas
- salidas
- ajustes
- consumo por consulta

### 5. sin auditoria

No existe una tabla para registrar:

- login
- cambios de roles
- exportaciones
- accesos a expedientes

## Rediseno recomendado

### Mantener

Se mantienen las tablas actuales:

- `users`
- `expedientes`
- `consultas`
- `inventario`

### Agregar

Se agregan:

- `personas`
- `consulta_medicamentos`
- `inventario_movimientos`
- `auditoria_accesos`

## Modelo objetivo

### personas

Representa la identidad institucional.

Una persona puede ser:

- estudiante
- profesor
- personal
- interno

### users

Representa la cuenta de acceso.

Se enlaza a `personas` mediante `persona_id`.

### expedientes

Representa el expediente clinico.

Se enlaza a `personas` mediante `persona_id`.

### consultas

Representa la atencion clinica registrada para un expediente.

### consulta_medicamentos

Representa los medicamentos o insumos usados en una consulta.

### inventario_movimientos

Registra entradas, salidas, ajustes y consumos asociados al inventario.

### auditoria_accesos

Registra eventos sensibles del sistema.

## Beneficios

- separacion clara entre identidad, cuenta y expediente
- portal institucional para estudiantes, profesores y personal
- consumo de medicamentos trazable por consulta
- inventario auditable
- seguridad y auditoria de acciones
- mejor base para reportes futuros

## Compatibilidad con tu sistema actual

El SQL propuesto no obliga a borrar inmediatamente tus tablas actuales.

Hace esto:

- agrega estructura faltante
- mejora restricciones
- crea relaciones nuevas
- migra expedientes actuales hacia `personas`
- deja tus tablas actuales utilizables por el backend mientras haces la transicion

## Orden de implementacion recomendado

1. Ejecutar el SQL de rediseno en Supabase.
2. Verificar que se crearon `personas`, `consulta_medicamentos`, `inventario_movimientos`, `auditoria_accesos`.
3. Confirmar que `users.persona_id` y `expedientes.persona_id` quedaron poblados.
4. Ajustar backend para usar `persona_id` como relacion principal.
5. Reemplazar el uso de `consultas.medicamentos` como texto por `consulta_medicamentos`.

## Archivo SQL

El script listo para pegar en el editor SQL de Supabase esta en:

- `docs/sql/rediseno_bd_supabase.sql`

## Nota importante

El script esta pensado para evolucionar la base actual con el menor rompimiento posible.

Aun asi:

- respalda la base antes de ejecutarlo
- pruebalo primero en un proyecto de prueba si puedes
- revisa si tus datos actuales tienen duplicados en `email`, `carnet_uni`, `codigo_empleado` o `nombre`

Si hay duplicados reales, primero debes limpiarlos para que las restricciones funcionen bien.
