import { Client } from "pg";

const DEFAULT_DATABASE_URL = "postgresql://localhost:5432/popalytics";

async function main() {
  const targetDatabaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const targetUrl = new URL(targetDatabaseUrl);
  const databaseName = decodeURIComponent(targetUrl.pathname.replace(/^\//, ""));

  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name");
  }

  const maintenanceUrl = new URL(targetUrl);
  maintenanceUrl.pathname = "/postgres";

  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();

  try {
    const existing = await client.query<{ datname: string }>(
      "SELECT datname FROM pg_database WHERE datname = $1",
      [databaseName],
    );

    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
      console.log(`Created database ${databaseName}`);
    } else {
      console.log(`Database ${databaseName} already exists`);
    }
  } finally {
    await client.end();
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
