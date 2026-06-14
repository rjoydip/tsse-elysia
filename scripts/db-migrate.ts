#!/usr/bin/env bun

/**
 * PGlite-aware migration runner.
 *
 * Detects which database driver is active and applies migrations accordingly:
 * - PGlite (WASM in-process) → applies SQL files via PGlite.exec()
 * - node-postgres / neon / pg-proxy → delegates to drizzle-kit migrate
 *
 * drizzle-kit migrate requires a real PostgreSQL server (TCP connection).
 * PGlite runs in-process (WASM) and is unreachable via TCP, so it needs
 * a different approach.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { dbLogger } from "~/lib/logger";

async function run(): Promise<void> {
  // Check if we have a real PG server connection string
  const hasRealPg = !!(process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL);

  if (hasRealPg) {
    // Real PostgreSQL — use drizzle-kit migrate
    const { spawnSync } = await import("node:child_process");
    dbLogger.info("Using real PostgreSQL — delegating to drizzle-kit migrate...");
    const result = spawnSync("bun", ["x", "drizzle-kit", "migrate"], {
      stdio: "inherit",
      cwd: resolve(import.meta.dir, ".."),
    });
    process.exit(result.status ?? 1);
    return;
  }

  // Ensure the drizzle/ migrations directory exists
  const migrationsDir = resolve(import.meta.dir, "../drizzle");
  if (!existsSync(migrationsDir)) {
    dbLogger.error(
      `No migrations directory found at ${migrationsDir}`,
      new Error(`Missing migrations directory: ${migrationsDir}`),
    );
    process.exit(1);
  }

  // PGlite — initializeDatabase() auto-migrates on startup
  const { initializeDatabase } = await import("~/config/db");
  dbLogger.info("Using PGlite — initializeDatabase will auto-migrate...");
  await initializeDatabase();

  dbLogger.info("Migration complete");
  process.exit(0);
}

run().catch((error) => {
  dbLogger.error("Migration failed", error instanceof Error ? error : new Error(String(error)));
  process.exit(1);
});