import { existsSync, rmSync } from "fs";
import { resolve } from "path";
import { Client } from "pg";
import { scriptLogger as logger } from "~/lib/logger";

async function removeDatabase() {
  // Try PostgreSQL first (Docker / production)
  if (process.env.POSTGRES_URL || process.env.POSTGRES_HOST) {
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
      database: "postgres",
    });

    try {
      await adminClient.connect();
      await adminClient.query(
        `SELECT pg_terminate_backend(pg_stat_activity.pid)
         FROM pg_stat_activity
         WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [database],
      );
      await adminClient.query(`DROP DATABASE IF EXISTS "${database}"`);
      logger.success(`Dropped PostgreSQL database: ${database}`);
    } catch (error) {
      logger.error(`Failed to drop PostgreSQL database: ${error}`);
      throw error;
    } finally {
      await adminClient.end();
    }
    return;
  }

  // Fallback: remove PGlite data directory
  const dataDir = process.env.PGLITE_DATA_DIR || ".artifacts/pglite-data";
  const fullPath = resolve(dataDir);

  if (existsSync(fullPath)) {
    rmSync(fullPath, { recursive: true, force: true });
    logger.success(`Removed PGlite data directory: ${fullPath}`);
  } else {
    logger.warn(`No data directory found at ${fullPath}, skipping`);
  }
}

async function main() {
  await removeDatabase();
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});