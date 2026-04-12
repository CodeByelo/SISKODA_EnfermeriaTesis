-- =========================================================
-- ESQUEMA NUEVO DESDE CERO
-- SISKODA ENFERMERIA
-- Diseñado para Supabase / PostgreSQL
-- =========================================================

begin;

create extension if not exists citext;

-- =========================================================
-- TIPOS
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_miembro') then
    create type tipo_miembro as enum ('estudiante', 'profesor', 'personal', 'interno');
  end if;

  if not exists (select 1 from pg_type where typname = 'rol_usuario') then
    create type rol_usuario as enum (
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

  if not exists (select 1 from pg_type where typname = 'estado_cuenta') then
    create type estado_cuenta as enum ('pendiente', 'activa', 'bloqueada');
  end if;

  if not exists (select 1 from pg_type where typname = 'visibilidad_paciente') then
    create type visibilidad_paciente as enum ('resumen', 'completo', 'restringido');
  end if;

  if not exists (select 1 from pg_type where typname = 'prioridad_consulta') then
    create type prioridad_consulta as enum ('baja', 'media', 'alta', 'critica');
  end if;

  if not exists (select 1 from pg_type where typname = 'tipo_movimiento_inventario') then
    create type tipo_movimiento_inventario as enum ('entrada', 'salida', 'ajuste', 'consumo_consulta');
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

create unique index if not exists uq_personas_cedula on public.personas (cedula) where cedula is not null;
create unique index if not exists uq_personas_codigo on public.personas (codigo_institucional) where codigo_institucional is not null;
create unique index if not exists uq_personas_correo on public.personas (correo_institucional) where correo_institucional is not null;
create index if not exists idx_personas_tipo_miembro on public.personas (tipo_miembro);
create index if not exists idx_personas_carrera_depto on public.personas (carrera_depto);

drop trigger if exists trg_personas_updated_at on public.personas;
create trigger trg_personas_updated_at
before update on public.personas
for each row
execute function set_updated_at();

-- =========================================================
-- USUARIOS
-- =========================================================

create table if not exists public.usuarios (
  id bigserial primary key,
  persona_id bigint not null references public.personas(id) on delete cascade,
  email citext not null,
  password_hash text not null,
  role rol_usuario not null,
  estado_cuenta estado_cuenta not null default 'activa',
  ultimo_acceso timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists uq_usuarios_email on public.usuarios (email);
create unique index if not exists uq_usuarios_persona on public.usuarios (persona_id);
create index if not exists idx_usuarios_role on public.usuarios (role);

drop trigger if exists trg_usuarios_updated_at on public.usuarios;
create trigger trg_usuarios_updated_at
before update on public.usuarios
for each row
execute function set_updated_at();

-- =========================================================
-- EXPEDIENTES
-- =========================================================

create table if not exists public.expedientes (
  id bigserial primary key,
  persona_id bigint not null references public.personas(id) on delete cascade,
  visibilidad_paciente visibilidad_paciente not null default 'resumen',
  observaciones_privadas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists uq_expedientes_persona on public.expedientes (persona_id);

drop trigger if exists trg_expedientes_updated_at on public.expedientes;
create trigger trg_expedientes_updated_at
before update on public.expedientes
for each row
execute function set_updated_at();

-- =========================================================
-- CONSULTAS
-- =========================================================

create table if not exists public.consultas (
  id bigserial primary key,
  expediente_id bigint not null references public.expedientes(id) on delete cascade,
  profesional_user_id bigint references public.usuarios(id) on delete set null,
  motivo text not null,
  sintomas text,
  diagnostico text,
  notas_recomendacion text,
  prioridad prioridad_consulta not null default 'media',
  fecha_consulta timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_consultas_expediente on public.consultas (expediente_id);
create index if not exists idx_consultas_profesional on public.consultas (profesional_user_id);
create index if not exists idx_consultas_prioridad on public.consultas (prioridad);
create index if not exists idx_consultas_fecha on public.consultas (fecha_consulta desc);

drop trigger if exists trg_consultas_updated_at on public.consultas;
create trigger trg_consultas_updated_at
before update on public.consultas
for each row
execute function set_updated_at();

-- =========================================================
-- INVENTARIO ITEMS
-- =========================================================

create table if not exists public.inventario_items (
  id bigserial primary key,
  nombre varchar(160) not null,
  descripcion text,
  categoria varchar(120),
  unidad_medida varchar(40) not null default 'unidad',
  stock_actual integer not null default 0 check (stock_actual >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists uq_inventario_items_nombre on public.inventario_items (lower(nombre));
create index if not exists idx_inventario_items_categoria on public.inventario_items (categoria);

drop trigger if exists trg_inventario_items_updated_at on public.inventario_items;
create trigger trg_inventario_items_updated_at
before update on public.inventario_items
for each row
execute function set_updated_at();

-- =========================================================
-- INVENTARIO LOTES
-- =========================================================

create table if not exists public.inventario_lotes (
  id bigserial primary key,
  inventario_item_id bigint not null references public.inventario_items(id) on delete cascade,
  lote varchar(120),
  fecha_vencimiento date,
  stock_lote integer not null default 0 check (stock_lote >= 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_inventario_lotes_item on public.inventario_lotes (inventario_item_id);
create index if not exists idx_inventario_lotes_vencimiento on public.inventario_lotes (fecha_vencimiento);

drop trigger if exists trg_inventario_lotes_updated_at on public.inventario_lotes;
create trigger trg_inventario_lotes_updated_at
before update on public.inventario_lotes
for each row
execute function set_updated_at();

-- =========================================================
-- CONSULTA MEDICAMENTOS
-- =========================================================

create table if not exists public.consulta_medicamentos (
  id bigserial primary key,
  consulta_id bigint not null references public.consultas(id) on delete cascade,
  inventario_item_id bigint references public.inventario_items(id) on delete set null,
  inventario_lote_id bigint references public.inventario_lotes(id) on delete set null,
  nombre_medicamento varchar(160) not null,
  cantidad integer not null check (cantidad > 0),
  indicaciones text,
  creado_en timestamptz not null default now()
);

create index if not exists idx_consulta_medicamentos_consulta on public.consulta_medicamentos (consulta_id);
create index if not exists idx_consulta_medicamentos_item on public.consulta_medicamentos (inventario_item_id);

-- =========================================================
-- INVENTARIO MOVIMIENTOS
-- =========================================================

create table if not exists public.inventario_movimientos (
  id bigserial primary key,
  inventario_item_id bigint not null references public.inventario_items(id) on delete cascade,
  inventario_lote_id bigint references public.inventario_lotes(id) on delete set null,
  tipo_movimiento tipo_movimiento_inventario not null,
  cantidad integer not null check (cantidad > 0),
  stock_anterior integer,
  stock_resultante integer,
  motivo text,
  referencia_consulta_id bigint references public.consultas(id) on delete set null,
  registrado_por_user_id bigint references public.usuarios(id) on delete set null,
  creado_en timestamptz not null default now()
);

create index if not exists idx_inventario_movimientos_item on public.inventario_movimientos (inventario_item_id);
create index if not exists idx_inventario_movimientos_lote on public.inventario_movimientos (inventario_lote_id);
create index if not exists idx_inventario_movimientos_tipo on public.inventario_movimientos (tipo_movimiento);
create index if not exists idx_inventario_movimientos_fecha on public.inventario_movimientos (creado_en desc);

-- =========================================================
-- AUDITORIA ACCESOS
-- =========================================================

create table if not exists public.auditoria_accesos (
  id bigserial primary key,
  user_id bigint references public.usuarios(id) on delete set null,
  persona_id bigint references public.personas(id) on delete set null,
  accion varchar(64) not null,
  modulo varchar(64) not null,
  recurso varchar(160),
  ip varchar(64),
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create index if not exists idx_auditoria_user on public.auditoria_accesos (user_id);
create index if not exists idx_auditoria_persona on public.auditoria_accesos (persona_id);
create index if not exists idx_auditoria_modulo on public.auditoria_accesos (modulo);
create index if not exists idx_auditoria_fecha on public.auditoria_accesos (creado_en desc);

-- =========================================================
-- VISTAS DE APOYO
-- =========================================================

create or replace view public.vw_pacientes as
select
  p.id as persona_id,
  p.tipo_miembro,
  p.cedula,
  p.codigo_institucional,
  p.nombres,
  p.apellidos,
  p.correo_institucional,
  p.telefono,
  p.carrera_depto,
  p.categoria,
  p.cargo,
  e.id as expediente_id,
  e.visibilidad_paciente
from public.personas p
left join public.expedientes e on e.persona_id = p.id;

create or replace view public.vw_consultas_detalle as
select
  c.id as consulta_id,
  c.fecha_consulta,
  c.prioridad,
  c.motivo,
  c.sintomas,
  c.diagnostico,
  c.notas_recomendacion,
  e.id as expediente_id,
  p.id as persona_id,
  p.nombres,
  p.apellidos,
  p.tipo_miembro
from public.consultas c
inner join public.expedientes e on e.id = c.expediente_id
inner join public.personas p on p.id = e.persona_id;

commit;
