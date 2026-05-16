import { Pool, type QueryResultRow } from "pg";

const DEFAULT_DATABASE_URL = "postgresql://localhost:5432/popalytics";

const globalForPostgres = globalThis as typeof globalThis & {
  popalyticsPgPool?: Pool;
};

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}

export function getPool(): Pool {
  if (!globalForPostgres.popalyticsPgPool) {
    globalForPostgres.popalyticsPgPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
    });
  }

  return globalForPostgres.popalyticsPgPool;
}

export async function queryRows<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, values);
  return result.rows;
}

export async function closePool(): Promise<void> {
  if (globalForPostgres.popalyticsPgPool) {
    await globalForPostgres.popalyticsPgPool.end();
    globalForPostgres.popalyticsPgPool = undefined;
  }
}
