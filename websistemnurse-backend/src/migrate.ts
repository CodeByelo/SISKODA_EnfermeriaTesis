import pool from './db';

const statements = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_miembro') THEN
        CREATE TYPE tipo_miembro AS ENUM ('estudiante', 'profesor', 'personal', 'interno');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
        CREATE TYPE rol_usuario AS ENUM (
          'admin',
          'enfermeria',
          'consulta',
          'inventario',
          'reportes',
          'estudiante',
          'profesor',
          'personal'
        );
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_cuenta') THEN
        CREATE TYPE estado_cuenta AS ENUM ('pendiente', 'activa', 'bloqueada');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibilidad_paciente') THEN
        CREATE TYPE visibilidad_paciente AS ENUM ('resumen', 'completo', 'restringido');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridad_consulta') THEN
        CREATE TYPE prioridad_consulta AS ENUM ('baja', 'media', 'alta', 'critica');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_movimiento_inventario') THEN
        CREATE TYPE tipo_movimiento_inventario AS ENUM ('entrada', 'salida', 'ajuste', 'consumo_consulta');
      END IF;
    END $$;
  `,
  `
    CREATE TABLE IF NOT EXISTS personas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tipo_miembro tipo_miembro NOT NULL,
      cedula VARCHAR(32),
      codigo_institucional VARCHAR(64),
      nombres VARCHAR(120) NOT NULL,
      apellidos VARCHAR(120) NOT NULL,
      correo_institucional VARCHAR(160),
      telefono VARCHAR(32),
      carrera_depto VARCHAR(160),
      categoria VARCHAR(120),
      cargo VARCHAR(120),
      lapso VARCHAR(32),
      fecha_vencimiento_carnet DATE,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS usuarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
      email VARCHAR(160) NOT NULL,
      password_hash TEXT NOT NULL,
      role rol_usuario NOT NULL,
      estado_cuenta estado_cuenta NOT NULL DEFAULT 'activa',
      ultimo_acceso TIMESTAMPTZ,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS expedientes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
      visibilidad_paciente visibilidad_paciente NOT NULL DEFAULT 'resumen',
      observaciones_privadas TEXT,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS consultas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expediente_id UUID NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
      profesional_user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
      motivo TEXT NOT NULL,
      sintomas TEXT,
      diagnostico TEXT,
      notas_recomendacion TEXT,
      prioridad prioridad_consulta NOT NULL DEFAULT 'media',
      fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS inventario_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(160) NOT NULL,
      descripcion TEXT,
      categoria VARCHAR(120),
      unidad_medida VARCHAR(40) NOT NULL DEFAULT 'unidad',
      stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
      stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS inventario_lotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      inventario_item_id UUID NOT NULL REFERENCES inventario_items(id) ON DELETE CASCADE,
      lote VARCHAR(120),
      fecha_vencimiento DATE,
      stock_lote INTEGER NOT NULL DEFAULT 0 CHECK (stock_lote >= 0),
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS consulta_medicamentos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
      inventario_item_id UUID REFERENCES inventario_items(id) ON DELETE SET NULL,
      inventario_lote_id UUID REFERENCES inventario_lotes(id) ON DELETE SET NULL,
      nombre_medicamento VARCHAR(160) NOT NULL,
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      indicaciones TEXT,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS inventario_movimientos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      inventario_item_id UUID NOT NULL REFERENCES inventario_items(id) ON DELETE CASCADE,
      inventario_lote_id UUID REFERENCES inventario_lotes(id) ON DELETE SET NULL,
      tipo_movimiento tipo_movimiento_inventario NOT NULL,
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      stock_anterior INTEGER,
      stock_resultante INTEGER,
      motivo TEXT,
      referencia_consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
      registrado_por_user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS auditoria_accesos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
      persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
      accion VARCHAR(64) NOT NULL,
      modulo VARCHAR(64) NOT NULL,
      recurso VARCHAR(160),
      ip VARCHAR(64),
      user_agent TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
];

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const statement of statements) {
      await client.query(statement);
    }
    await client.query('COMMIT');
    console.log('Migracion UUID completada');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error ejecutando migracion UUID:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void migrate();
