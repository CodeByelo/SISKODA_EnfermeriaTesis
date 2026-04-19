import pool from './db';

type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<unknown>;
};

type AuditInput = {
  userId?: string | null;
  personaId?: string | null;
  accion: string;
  modulo: string;
  recurso?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(
  input: AuditInput,
  queryable: Queryable = pool
) {
  try {
    await queryable.query(
      `
        INSERT INTO auditoria_accesos (
          user_id,
          persona_id,
          accion,
          modulo,
          recurso,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        input.userId ?? null,
        input.personaId ?? null,
        input.accion,
        input.modulo,
        input.recurso ?? null,
        JSON.stringify(input.metadata ?? {}),
      ]
    );
  } catch (error) {
    console.error('No se pudo registrar auditoria:', error);
  }
}
