# Rediseno De Base De Datos

## Objetivo

Definir un esquema nuevo de base de datos para el sistema de enfermeria, optimizado para:

- expediente clinico
- consultas medicas
- inventario
- cuentas internas
- portal para estudiantes, profesores y personal
- auditoria y seguridad

Este documento ya no plantea una migracion gradual sobre el esquema viejo. Plantea el esquema objetivo recomendado para reconstruir la base correctamente.

## Problema Del Esquema Actual

Tu base actual funciona, pero tiene limitaciones estructurales:

- mezcla identidad institucional con expediente clinico
- guarda medicamentos en texto libre dentro de la consulta
- no tiene historial formal de movimientos de inventario
- no enlaza correctamente cuentas de acceso con personas reales
- no tiene una capa limpia para portal personal
- no tiene auditoria operativa

## Enfoque Nuevo

El sistema debe separarse en 6 dominios:

1. identidad institucional
2. autenticacion y roles
3. expediente clinico
4. consultas y tratamiento
5. inventario y movimientos
6. auditoria y seguimiento

## Esquema Recomendado

### 1. personas

Representa a la persona real dentro del instituto.

Tipos posibles:

- estudiante
- profesor
- personal
- interno

Esta tabla centraliza:

- cedula
- codigo institucional
- nombres
- apellidos
- correo institucional
- telefono
- carrera o departamento
- categoria
- cargo
- lapso
- vencimiento del carnet

### 2. usuarios

Representa la cuenta de acceso.

Cada usuario se vincula a una persona.

Campos clave:

- email
- password_hash
- role
- persona_id
- estado_cuenta
- ultimo_acceso

### 3. expedientes

Representa el expediente clinico.

Cada expediente pertenece a una persona.

Campos clave:

- persona_id
- tipo_paciente
- visibilidad_paciente
- observaciones_privadas
- fechas de creacion y actualizacion

La identidad no debe duplicarse aqui.

### 4. consultas

Representa una atencion clinica.

Cada consulta pertenece a un expediente y opcionalmente a un usuario profesional.

Campos clave:

- expediente_id
- profesional_user_id
- motivo
- sintomas
- diagnostico
- notas_recomendacion
- prioridad
- fecha_consulta

### 5. consulta_medicamentos

Relaciona una consulta con uno o varios medicamentos o insumos usados.

Esto reemplaza el campo de texto libre de medicamentos.

Campos clave:

- consulta_id
- inventario_id
- nombre_medicamento
- cantidad
- indicaciones

### 6. inventario_items

Representa cada insumo o medicamento.

Campos clave:

- nombre
- descripcion
- categoria
- unidad_medida
- stock_actual
- stock_minimo
- activo

### 7. inventario_lotes

Separa lotes, vencimientos y stock por lote.

Campos clave:

- inventario_item_id
- lote
- fecha_vencimiento
- stock_lote

### 8. inventario_movimientos

Bitacora de entradas, salidas, ajustes y consumos.

Campos clave:

- inventario_item_id
- inventario_lote_id
- tipo_movimiento
- cantidad
- stock_anterior
- stock_resultante
- referencia_consulta_id
- registrado_por_user_id
- motivo

### 9. auditoria_accesos

Bitacora de acciones sensibles.

Campos clave:

- user_id
- persona_id
- accion
- modulo
- recurso
- ip
- user_agent
- metadata

## Relaciones Principales

- `personas 1 -> 1 usuarios`
- `personas 1 -> 1 expedientes`
- `expedientes 1 -> n consultas`
- `consultas 1 -> n consulta_medicamentos`
- `inventario_items 1 -> n inventario_lotes`
- `inventario_items 1 -> n inventario_movimientos`
- `consultas 1 -> n inventario_movimientos` cuando el movimiento sea consumo

## Ventajas Del Nuevo Esquema

### Identidad limpia

La persona institucional existe una sola vez.

### Seguridad real

La cuenta de acceso queda vinculada a una persona y un rol.

### Portal personal correcto

Estudiantes, profesores y personal pueden entrar a ver solo su informacion.

### Expediente mejor estructurado

El expediente deja de ser una tabla mezclada con datos institucionales.

### Inventario trazable

Se sabe que entro, que salio, en que lote, cuando vencio y en que consulta se consumio.

### Reportes mas fuertes

Ya puedes generar reportes por:

- tipo de miembro
- carrera
- frecuencia de consultas
- medicamentos mas usados
- lotes proximos a vencer
- consumo por periodo

## Decisiones De Modelado

### Por que separar personas y expedientes

Porque una persona no es lo mismo que un expediente. El expediente es la historia clinica de esa persona.

### Por que separar consulta_medicamentos

Porque guardar medicamentos en texto libre rompe inventario, auditoria y reportes.

### Por que separar inventario_lotes

Porque el vencimiento y el lote no pertenecen al item general, sino a entradas especificas.

### Por que mantener auditoria separada

Porque seguridad y operacion no deben mezclarse con el modulo clinico.

## Tablas Finales Recomendadas

- `personas`
- `usuarios`
- `expedientes`
- `consultas`
- `consulta_medicamentos`
- `inventario_items`
- `inventario_lotes`
- `inventario_movimientos`
- `auditoria_accesos`

## Qué Haria Con Las Tablas Viejas

Si vas a reconstruir desde cero:

- `users` pasa a `usuarios`
- `inventario` se reemplaza por `inventario_items`
- `expedientes` y `consultas` se rediseñan

Si quieres mantener nombres actuales por compatibilidad de backend, se puede hacer, pero a nivel de diseño el modelo superior es el descrito arriba.

## Recomendacion Practica

Si de verdad quieres optimizar el sistema, yo haria esto:

1. crear una base nueva con el esquema objetivo
2. migrar datos utiles de la base vieja
3. adaptar backend a ese nuevo esquema
4. despues retirar el esquema anterior

Eso es mas limpio que seguir parchando la estructura actual.

## SQL

El SQL completo del esquema nuevo esta en:

- `docs/sql/esquema_nuevo_supabase.sql`
