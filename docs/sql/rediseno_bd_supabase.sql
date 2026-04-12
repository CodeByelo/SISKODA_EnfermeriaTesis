-- =========================================================
-- REDISENO DE BASE DE DATOS PARA SISKODA ENFERMERIA
-- Compatible con la estructura actual mostrada en Supabase
-- Antes de ejecutar: haz un backup
-- =========================================================

begin;

create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum (
      'admin',
      'enfermeria',
      'consulta',
      'inventario',
      'reportes',
      'estudiante',
      'profesor',
      'personal'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'tipo_miembro') then
    create type tipo_miembro as enum (
      'estudiante',
      'profesor',
      'personal',
      'interno'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'estado_cuenta') then
    create type estado_cuenta as enum (
      'pendiente',
      'activa',
      'bloqueada'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'prioridad_consulta') then
    create type prioridad_consulta as enum (
      'baja',
      'media',
      'alta',
      'critica'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'visibilidad_paciente') then
    create type visibilidad_paciente as enum (
      'resumen',
      'completo',
      'restringido'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'tipo_movimiento_inventario') then
    create type tipo_movimiento_inventario as enum (
      'entrada',
      'salida',
      'ajuste',
      'consumo_consulta'
    );
  end if;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

-- =========================================================
-- PERSONAS
-- Identidad institucional separada del expediente
-- =========================================================

create table if not exists public.personas (
  id bigserial primary key,
  tipo_miembro tipo_miembro not null,
  cedula varchar(32),
  codigo_institucional varchar(64),
  nombres varchar(120) not null,
  apellidos varchar(120) not null,
  correo_institucional citext,
  telefono varchar(32),
  carrera_depto varchar(160),
  categoria varchar(120),
  cargo varchar(120),
  lapso varchar(32),
  fecha_vencimiento_carnet date,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists idx_personas_cedula_unique
on public.personas (cedula)
where cedula is not null;

create unique index if not exists idx_personas_codigo_unique
on public.personas (codigo_institucional)
where codigo_institucional is not null;

create unique index if not exists idx_personas_correo_unique
on public.personas (correo_institucional)
where correo_institucional is not null;

drop trigger if exists trg_personas_updated_at on public.personas;
create trigger trg_personas_updated_at
before update on public.personas
for each row
execute function set_updated_at();

-- =========================================================
-- USERS
-- Mantiene compatibilidad, pero mejora cuenta y seguridad
-- =========================================================

alter table public.users
  add column if not exists persona_id bigint references public.personas(id) on delete set null,
  add column if not exists estado_cuenta estado_cuenta not null default 'activa',
  add column if not exists ultimo_acceso timestamptz,
  add column if not exists creado_en timestamptz not null default now(),
  add column if not exists actualizado_en timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'created_at'
  ) then
    execute 'update public.users set creado_en = coalesce(creado_en, created_at)';
  end if;
exception
  when others then null;
end $$;

create unique index if not exists idx_users_email_unique
on public.users (lower(email));

create index if not exists idx_users_persona_id
on public.users (persona_id);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'role'
      and data_type <> 'USER-DEFINED'
  ) then
    begin
      alter table public.users
      alter column role type app_role
      using lower(role)::app_role;
    exception
      when others then null;
    end;
  end if;
end $$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function set_updated_at();

-- =========================================================
-- EXPEDIENTES
-- Conserva datos actuales, pero se enlaza a personas
-- =========================================================

alter table public.expedientes
  add column if not exists persona_id bigint references public.personas(id) on delete set null,
  add column if not exists visibilidad_paciente visibilidad_paciente not null default 'resumen',
  add column if not exists observaciones_privadas text;

create index if not exists idx_expedientes_persona_id
on public.expedientes (persona_id);

create unique index if not exists idx_expedientes_carnet_tipo_unique
on public.expedientes (carnet_uni, tipo_paciente)
where carnet_uni is not null;

create unique index if not exists idx_expedientes_codigo_tipo_unique
on public.expedientes (codigo_empleado, tipo_paciente)
where codigo_empleado is not null;

drop trigger if exists trg_expedientes_updated_at on public.expedientes;
create trigger trg_expedientes_updated_at
before update on public.expedientes
for each row
execute function set_updated_at();

-- =========================================================
-- CONSULTAS
-- Se mantiene tabla actual y se fortalece integridad
-- =========================================================

alter table public.consultas
  add column if not exists profesional_user_id bigint references public.users(id) on delete set null,
  add column if not exists actualizado_en timestamptz not null default now();

create index if not exists idx_consultas_paciente_id
on public.consultas (paciente_id);

create index if not exists idx_consultas_creado_en
on public.consultas (creado_en desc);

create index if not exists idx_consultas_prioridad
on public.consultas (prioridad);

drop trigger if exists trg_consultas_updated_at on public.consultas;
create trigger trg_consultas_updated_at
before update on public.consultas
for each row
execute function set_updated_at();

-- =========================================================
-- CONSULTA_MEDICAMENTOS
-- Reemplaza progresivamente el texto libre de medicamentos
-- =========================================================

create table if not exists public.consulta_medicamentos (
  id bigserial primary key,
  consulta_id bigint not null references public.consultas(id) on delete cascade,
  inventario_id bigint references public.inventario(id) on delete set null,
  medicamento_nombre varchar(160) not null,
  cantidad integer not null default 1 check (cantidad > 0),
  indicaciones text,
  creado_en timestamptz not null default now()
);

create index if not exists idx_consulta_medicamentos_consulta_id
on public.consulta_medicamentos (consulta_id);

create index if not exists idx_consulta_medicamentos_inventario_id
on public.consulta_medicamentos (inventario_id);

-- =========================================================
-- INVENTARIO
-- Mantiene compatibilidad y agrega estado operativo
-- =========================================================

alter table public.inventario
  add column if not exists activo boolean not null default true;

create unique index if not exists idx_inventario_nombre_unique
on public.inventario (lower(nombre));

create index if not exists idx_inventario_categoria
on public.inventario (categoria);

create index if not exists idx_inventario_vencimiento
on public.inventario (fecha_vencimiento);

drop trigger if exists trg_inventario_updated_at on public.inventario;
create trigger trg_inventario_updated_at
before update on public.inventario
for each row
execute function set_updated_at();

-- =========================================================
-- INVENTARIO_MOVIMIENTOS
-- Bitacora de inventario
-- =========================================================

create table if not exists public.inventario_movimientos (
  id bigserial primary key,
  inventario_id bigint not null references public.inventario(id) on delete cascade,
  tipo tipo_movimiento_inventario not null,
  cantidad integer not null check (cantidad > 0),
  stock_anterior integer,
  stock_resultante integer,
  motivo text,
  referencia_consulta_id bigint references public.consultas(id) on delete set null,
  registrado_por_user_id bigint references public.users(id) on delete set null,
  lote varchar(120),
  fecha_vencimiento date,
  creado_en timestamptz not null default now()
);

create index if not exists idx_inventario_movimientos_inventario_id
on public.inventario_movimientos (inventario_id);

create index if not exists idx_inventario_movimientos_consulta_id
on public.inventario_movimientos (referencia_consulta_id);

create index if not exists idx_inventario_movimientos_creado_en
on public.inventario_movimientos (creado_en desc);

-- =========================================================
-- AUDITORIA_ACCESOS
-- Seguridad y trazabilidad
-- =========================================================

create table if not exists public.auditoria_accesos (
  id bigserial primary key,
  user_id bigint references public.users(id) on delete set null,
  persona_id bigint references public.personas(id) on delete set null,
  accion varchar(64) not null,
  modulo varchar(64) not null,
  recurso varchar(160),
  ip varchar(64),
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create index if not exists idx_auditoria_user_id
on public.auditoria_accesos (user_id);

create index if not exists idx_auditoria_persona_id
on public.auditoria_accesos (persona_id);

create index if not exists idx_auditoria_creado_en
on public.auditoria_accesos (creado_en desc);

-- =========================================================
-- MIGRACION DE DATOS DESDE EXPEDIENTES HACIA PERSONAS
-- Crea personas usando los datos ya existentes
-- =========================================================

insert into public.personas (
  tipo_miembro,
  codigo_institucional,
  nombres,
  apellidos,
  correo_institucional,
  telefono,
  carrera_depto,
  categoria,
  cargo,
  activo
)
select
  case
    when lower(coalesce(e.tipo_paciente, '')) like 'estudiante%' then 'estudiante'::tipo_miembro
    when lower(coalesce(e.tipo_paciente, '')) like 'profesor%' then 'profesor'::tipo_miembro
    when lower(coalesce(e.tipo_paciente, '')) like 'personal%' then 'personal'::tipo_miembro
    else 'interno'::tipo_miembro
  end,
  coalesce(nullif(trim(e.carnet_uni), ''), nullif(trim(e.codigo_empleado), '')),
  trim(e.nombre),
  trim(e.apellido),
  nullif(trim(e.email), ''),
  nullif(trim(e.telefono), ''),
  nullif(trim(e.carrera_depto), ''),
  nullif(trim(e.categoria), ''),
  nullif(trim(e.cargo), ''),
  true
from public.expedientes e
where not exists (
  select 1
  from public.personas p
  where lower(trim(p.nombres)) = lower(trim(e.nombre))
    and lower(trim(p.apellidos)) = lower(trim(e.apellido))
    and coalesce(p.codigo_institucional, '') = coalesce(coalesce(nullif(trim(e.carnet_uni), ''), nullif(trim(e.codigo_empleado), '')), '')
);

update public.expedientes e
set persona_id = p.id
from public.personas p
where e.persona_id is null
  and lower(trim(p.nombres)) = lower(trim(e.nombre))
  and lower(trim(p.apellidos)) = lower(trim(e.apellido))
  and (
    coalesce(p.codigo_institucional, '') = coalesce(coalesce(nullif(trim(e.carnet_uni), ''), nullif(trim(e.codigo_empleado), '')), '')
    or coalesce(lower(p.correo_institucional::text), '') = coalesce(lower(e.email), '')
  );

-- =========================================================
-- VISTAS OPERATIVAS OPCIONALES
-- Utiles para reportes y depuracion
-- =========================================================

create or replace view public.vw_expedientes_personas as
select
  e.id as expediente_id,
  e.tipo_paciente,
  e.carnet_uni,
  e.codigo_empleado,
  e.nombre,
  e.apellido,
  e.email,
  e.telefono,
  e.carrera_depto,
  e.categoria,
  e.cargo,
  e.visibilidad_paciente,
  e.creado_en as expediente_creado_en,
  p.id as persona_id,
  p.tipo_miembro,
  p.cedula,
  p.codigo_institucional,
  p.correo_institucional,
  p.activo
from public.expedientes e
left join public.personas p on p.id = e.persona_id;

create or replace view public.vw_consultas_detalle as
select
  c.id as consulta_id,
  c.paciente_id,
  c.profesional_user_id,
  c.motivo,
  c.sintomas,
  c.diagnostico,
  c.notas_recom,
  c.prioridad,
  c.creado_en,
  e.persona_id,
  e.nombre,
  e.apellido,
  e.tipo_paciente
from public.consultas c
inner join public.expedientes e on e.id = c.paciente_id;

commit;

-- =========================================================
-- FIN DEL SCRIPT
-- =========================================================
