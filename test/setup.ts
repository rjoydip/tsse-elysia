/**
 * Test setup - initializes in-memory SQLite database.
 *
 * Reads all Drizzle migration SQL files and creates tables
 * in an in-memory SQLite database so contract/integration tests
 * have access to all required tables without manual maintenance.
 *
 * Tables that already exist from Better Auth's auto-migration
 * are handled gracefully via IF NOT EXISTS.
 */

import { afterEach } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeDatabase, getDatabasePools, getWriteDb } from "~/config/db";

/**
 * Returns all Drizzle migration SQL file paths sorted by version.
 */
function getMigrationFiles(): string[] {
  const migrationsDir = resolve(import.meta.dir, "../drizzle");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files.map((f) => resolve(migrationsDir, f));
}

/**
 * Executes all Drizzle migration SQL statements against the database.
 * Uses CREATE TABLE IF NOT EXISTS to gracefully handle re-runs.
 */
async function runMigrations(db: ReturnType<typeof getWriteDb>): Promise<void> {
  const files = getMigrationFiles();
  for (const filePath of files) {
    const sql = readFileSync(filePath, "utf-8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS for idempotency
        const safeStmt = stmt.replace(/^CREATE\s+TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
        await db.execute(safeStmt);
      } catch {
        // Skip statements that fail (e.g., index creation if table is partial)
      }
    }
  }
}

export async function setup() {
  // Set environment variables for test database
  process.env.DATABASE_TYPE = "sqlite";
  process.env.SQLITE_URL = ":memory:";

  // Initialize database connection
  await initializeDatabase();

  const pools = getDatabasePools();

  // Verify that the required database (sqlite or pg) is ready.
  // In the test environment, we expect sqlite.
  if (!pools.sqlite && !pools.primary) {
    throw new Error("Database failed to initialize for tests");
  }

  // Create all tables from Drizzle migrations in the in-memory database
  const db = getWriteDb();
  try {
    await runMigrations(db);
  } catch (error) {
    console.warn("Failed to run migrations for tests:", error);
  }
}

// If on Node/Bun, attempt to hint memory management
if (global.gc) {
  afterEach(() => {
    global.gc!();
  });
}

await setup();