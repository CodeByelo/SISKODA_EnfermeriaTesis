import pool from './db';

const statements = [
  `
    CREATE TABLE IF NOT EXISTS personas (
      id SERIAL PRIMARY KEY,
      tipo_miembro VARCHAR(32) NOT NULL CHECK (tipo_miembro IN ('estudiante', 'profesor', 'personal', 'interno')),
      cedula VARCHAR(32),
      codigo_institucional VARCHAR(64),
      nombres VARCHAR(120) NOT NULL,
      apellidos VARCHAR(120) NOT NULL,
      correo_institucional VARCHAR(160),
      telefono VARCHAR(32),
      carrera_depto VARCHAR(160),
      cargo VARCHAR(120),
      lapso VARCHAR(32),
      fecha_vencimiento_carnet DATE,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `,
  `ALTER TABLE personas ADD COLUMN IF NOT EXISTS categoria VARCHAR(120);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS persona_id INTEGER REFERENCES personas(id) ON DELETE SET NULL;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS estado_cuenta VARCHAR(24) NOT NULL DEFAULT 'activa';`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP;`,
  `ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS persona_id INTEGER REFERENCES personas(id) ON DELETE SET NULL;`,
  `ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS visibilidad_paciente VARCHAR(24) NOT NULL DEFAULT 'resumen';`,
  `
    CREATE TABLE IF NOT EXISTS auditoria_accesos (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      persona_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
      accion VARCHAR(64) NOT NULL,
      modulo VARCHAR(64) NOT NULL,
      recurso VARCHAR(160),
      ip VARCHAR(64),
      user_agent TEXT,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `,
  `
    INSERT INTO personas (
      tipo_miembro,
      cedula,
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
    SELECT
      CASE
        WHEN LOWER(e.tipo_paciente) LIKE 'estudiante%' THEN 'estudiante'
        WHEN LOWER(e.tipo_paciente) LIKE 'profesor%' THEN 'profesor'
        WHEN LOWER(e.tipo_paciente) LIKE 'personal%' THEN 'personal'
        ELSE 'interno'
      END,
      NULL,
      COALESCE(NULLIF(TRIM(e.carnet_uni), ''), NULLIF(TRIM(e.codigo_empleado), '')),
      e.nombre,
      e.apellido,
      NULLIF(TRIM(e.email), ''),
      NULLIF(TRIM(e.telefono), ''),
      NULLIF(TRIM(e.carrera_depto), ''),
      NULLIF(TRIM(e.categoria), ''),
      NULLIF(TRIM(e.cargo), ''),
      TRUE
    FROM expedientes e
    WHERE e.persona_id IS NULL
    ON CONFLICT DO NOTHING;
  `,
  `
    UPDATE expedientes e
    SET persona_id = p.id
    FROM personas p
    WHERE e.persona_id IS NULL
      AND LOWER(TRIM(e.nombre)) = LOWER(TRIM(p.nombres))
      AND LOWER(TRIM(e.apellido)) = LOWER(TRIM(p.apellidos))
      AND (
        (e.email IS NOT NULL AND p.correo_institucional IS NOT NULL AND LOWER(TRIM(e.email)) = LOWER(TRIM(p.correo_institucional)))
        OR (
          COALESCE(NULLIF(TRIM(e.carnet_uni), ''), NULLIF(TRIM(e.codigo_empleado), '')) IS NOT NULL
          AND COALESCE(NULLIF(TRIM(e.carnet_uni), ''), NULLIF(TRIM(e.codigo_empleado), '')) = p.codigo_institucional
        )
      );
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_cedula_unique
    ON personas(cedula)
    WHERE cedula IS NOT NULL;
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_codigo_unique
    ON personas(codigo_institucional)
    WHERE codigo_institucional IS NOT NULL;
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_correo_unique
    ON personas(LOWER(correo_institucional))
    WHERE correo_institucional IS NOT NULL;
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_users_persona_id ON users(persona_id);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_expedientes_persona_id ON expedientes(persona_id);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON consultas(paciente_id);
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
    console.log('Migracion completada');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error ejecutando migracion:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void migrate();
