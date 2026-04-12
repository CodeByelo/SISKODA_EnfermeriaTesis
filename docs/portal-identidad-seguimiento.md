# Portal De Identidad Y Seguimiento

## Objetivo

Extender el sistema de enfermeria para que estudiantes, profesores y personal del instituto tengan una cuenta propia y puedan consultar su historial segun su identidad institucional, sin exponer informacion de otras personas.

## Principios

- La seguridad real vive en el backend, no en el frontend.
- Cada cuenta institucional debe quedar vinculada a una sola persona.
- Un usuario normal solo puede ver su propio historial.
- El personal de enfermeria y administracion ve informacion segun rol.
- La identidad academica y la identidad clinica deben relacionarse, pero no mezclarse sin control.

## Modelo Propuesto

### 1. identidad institucional

Representa a la persona dentro del instituto.

Campos sugeridos:

- `id`
- `tipo_miembro` (`estudiante`, `profesor`, `personal`)
- `cedula`
- `codigo_institucional`
- `nombres`
- `apellidos`
- `correo_institucional`
- `telefono`
- `carrera_depto`
- `cargo`
- `lapso`
- `fecha_vencimiento_carnet`
- `activo`
- `creado_en`
- `actualizado_en`

Uso:

- `cedula` puede ser la llave humana principal.
- `codigo_institucional` debe existir si la universidad maneja carnet o codigo interno.
- `lapso` y `fecha_vencimiento_carnet` sirven para validar vigencia academica.

### 2. users

La tabla `users` sigue manejando acceso al sistema.

Campos actuales:

- `id`
- `email`
- `password`
- `role`

Campos nuevos sugeridos:

- `persona_id`
- `estado_cuenta` (`pendiente`, `activa`, `bloqueada`)
- `ultimo_acceso`

Uso:

- `persona_id` enlaza la cuenta del sistema con la identidad institucional.
- No debe existir mas de una cuenta activa para la misma persona.

### 3. expedientes

La tabla `expedientes` sigue siendo el expediente clinico.

Campos ya presentes y utiles:

- `tipo_paciente`
- `carnet_uni`
- `codigo_empleado`
- `nombre`
- `apellido`
- `email`
- `telefono`
- `carrera_depto`
- `categoria`
- `cargo`

Campos nuevos sugeridos:

- `persona_id`
- `visibilidad_paciente` (`resumen`, `completo`, `restringido`)

Uso:

- `persona_id` conecta expediente con la persona institucional.
- Esto evita duplicidad entre cuenta, identidad y expediente.

### 4. auditoria_accesos

Tabla nueva para seguridad.

Campos sugeridos:

- `id`
- `user_id`
- `persona_id`
- `accion`
- `modulo`
- `recurso`
- `ip`
- `user_agent`
- `creado_en`

Ejemplos de acciones:

- `login`
- `logout`
- `ver_expediente`
- `exportar_reporte`
- `cambiar_rol`

## Relaciones

- `users.persona_id -> identidad_institucional.id`
- `expedientes.persona_id -> identidad_institucional.id`
- `consultas.paciente_id -> expedientes.id`

Con esto:

- una persona tiene una cuenta
- una persona tiene un expediente clinico
- un expediente tiene muchas consultas

## Roles Recomendados

### Roles internos

- `admin`
- `enfermeria`
- `consulta`
- `inventario`
- `reportes`

### Roles de portal personal

- `estudiante`
- `profesor`
- `personal`

## Permisos Recomendados

### admin

- gestiona usuarios
- gestiona roles
- ve auditoria
- puede ver reportes globales

### enfermeria

- crea y edita expedientes
- crea consultas
- consulta historiales
- da seguimiento

### consulta

- registra consultas
- revisa historial clinico segun permiso

### inventario

- accede solo a inventario

### reportes

- accede a reportes operativos

### estudiante

- ve solo su propio historial
- ve recomendaciones y seguimiento
- descarga constancias permitidas

### profesor

- ve solo su propio historial

### personal

- ve solo su propio historial

## Flujo De Registro Recomendado

### Opcion recomendada

1. El instituto carga o sincroniza la tabla `identidad_institucional`.
2. La persona se registra con `cedula` o `correo institucional`.
3. El sistema valida que exista en `identidad_institucional`.
4. Se crea la cuenta en `users`.
5. Si no existe expediente, se crea o se vincula uno.

### Opcion manual inicial

1. Enfermeria o admin crea la persona.
2. Admin genera la cuenta.
3. La persona entra y cambia su clave.

## Uso Del Carnet Universitario

El carnet del estudiante si sirve como fuente de datos, pero no como unica base de seguridad.

Campos utiles del carnet:

- `cedula`
- `nombre`
- `apellidos`
- `carrera`
- `lapso`
- `vence`

Recomendacion:

- usar `cedula` como identificador principal
- usar `codigo_institucional` o `carnet_uni` si existe formalmente
- guardar la foto del carnet solo como soporte documental, no como llave de autenticacion

## Vistas Nuevas Recomendadas

### Mi perfil

- datos institucionales
- estado de cuenta
- datos de contacto

### Mi historial

- consultas registradas
- fechas
- diagnosticos visibles
- medicamentos
- recomendaciones

### Seguimiento

- casos pendientes
- reposos
- reincidencias
- alertas de control

### Seguridad

- sesiones activas
- ultimos accesos
- historial de cambios sensibles

## Backend Necesario

- middleware por rol
- middleware para validar `self-access`
- endpoint `GET /api/me`
- endpoint `GET /api/mi-historial`
- endpoint `GET /api/mi-perfil`
- auditoria de acciones sensibles

## Frontend Necesario

- rutas separadas para portal personal
- menu segun rol
- proteccion de rutas por rol
- pantalla de acceso denegado
- estado de sesion mas estricto

## Fases De Implementacion

### Fase 1

- crear tabla `identidad_institucional`
- enlazar `users` y `expedientes` con `persona_id`
- crear endpoint `GET /api/me`

### Fase 2

- crear portal `Mi historial`
- permitir acceso a `estudiante`, `profesor` y `personal`
- aplicar permisos por backend

### Fase 3

- agregar auditoria
- agregar seguimiento
- agregar constancias o reposos descargables

## Decision Recomendada

La mejor evolucion del sistema no es abrir el panel administrativo a todos, sino crear dos capas:

- capa interna: enfermeria, administracion y operacion
- capa personal: estudiante, profesor y personal

Eso te deja crecer sin comprometer privacidad ni control.
