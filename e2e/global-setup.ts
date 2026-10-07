import { execSync } from "node:child_process";

import pg from "pg";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://planify:planify@localhost:5433/planify_test";

/** Crea la base de datos de pruebas (si falta) y aplica las migraciones. */
export default async function globalSetup() {
  const url = new URL(TEST_DATABASE_URL);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));

  const adminUrl = new URL(TEST_DATABASE_URL);
  adminUrl.pathname = "/planify";

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const existing = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`[e2e] Base de datos creada: ${databaseName}`);
    }
  } finally {
    await client.end();
  }

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
