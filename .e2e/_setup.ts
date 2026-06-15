/**
 * setup for E2E tests.
 * Sets up the database before tests run.
 */

import { execSync } from "child_process";
import { logger } from "../src/lib/logger";

export default async function globalSetup() {
  logger.log("[E2E Setup] Setting up database...");

  if (process.env.POSTGRES_URL || process.env.PGLITE_DATA_DIR) {
    logger.log(`[E2E Setup] Using existing database configuration`);
  } else {
    logger.log("[E2E Setup] No PG config found, will use PGlite in-memory");
  }

  logger.log("[E2E Setup] Running db:migrate to create tables...");

  try {
    execSync("bun run db:migrate", {
      stdio: "inherit",
      env: { ...process.env },
    });
    logger.log("[E2E Setup] Database schema migrated successfully");
  } catch (error) {
    logger.error("[E2E Setup] Failed to migrate database schema", error);
  }

  logger.log("[E2E Setup] Setup complete");
}