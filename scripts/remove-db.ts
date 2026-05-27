import { existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { Client } from "pg";
import { scriptLogger as logger } from "~/lib/logger";

async function removePostgresDatabase() {
  const host = process.env.POSTGRES_HOST || "localhost";
  const port = parseInt(process.env.POSTGRES_PORT || "5432", 10);
  const user = process.env.POSTGRES_USER || "tsse";
  const password = process.env.POSTGRES_PASSWORD || "";
  const database = process.env.POSTGRES_DB || "tsse_dev";

  const adminClient = new Client({
    host,
    port,
    user,
    password,
    database: "postgres", // Connect to default postgres db to drop our db
  });

  try {
    await adminClient.connect();

    // Terminate existing connections to the database
    await adminClient.query(
      `
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `,
      [database],
    );

    // Drop the database
    await adminClient.query(`DROP DATABASE IF EXISTS ${database}`);
    logger.success(`Dropped PostgreSQL database: ${database}`);
  } catch (error) {
    logger.error(`Failed to drop PostgreSQL database: ${error}`);
    throw error;
  } finally {
    await adminClient.end();
  }
}

async function removeSQLiteDatabase(dbPath: string) {
  const fullPath = resolve(dbPath);

  if (existsSync(fullPath)) {
    unlinkSync(fullPath);
    logger.success(`Removed SQLite database: ${fullPath}`);
  } else {
    logger.warn(`No database file found at ${fullPath}, skipping`);
  }
}

async function main() {
  const dbType = process.env.DATABASE_TYPE || "sqlite";
  const sqliteDbUrl = process.env.SQLITE_URL || "file:.artifacts/tsse-elysia.db";

  const dbPath = sqliteDbUrl.replace(/^file:/, "");

  if (dbType === "postgres") {
    await removePostgresDatabase();
  } else {
    removeSQLiteDatabase(dbPath);
  }
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});