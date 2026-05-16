import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { closePool, getPool } from "../src/lib/db/client";

async function main() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    const existing = await pool.query("SELECT version FROM schema_migrations WHERE version = $1", [
      migrationFile,
    ]);

    if (existing.rowCount && existing.rowCount > 0) {
      console.log(`Skipping ${migrationFile}`);
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, migrationFile), "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [migrationFile]);
      await client.query("COMMIT");
      console.log(`Applied ${migrationFile}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
