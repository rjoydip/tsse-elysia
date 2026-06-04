/**
 * Test setup - initializes in-memory SQLite database.
 *
 * Reads all Drizzle migration SQL files and creates tables
 * in an in-memory SQLite database so contract/integration tests
 * have access to all required tables without manual maintenance.
 *
 * Tables that already exist from Better Auth's auto-migration
 * are handled gracefully via IF NOT EXISTS.
 *
 * NOTE: Environment variables must be set before any module import
 * that transitively imports ~/config/db (which initializes the DB at
 * module evaluation time). We use await import() instead of static
 * imports to ensure the env vars are set first.
 */

import { afterEach } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Set env vars BEFORE any import of ~/config/db to ensure in-memory DB.
process.env.DATABASE_TYPE = "sqlite";
process.env.SQLITE_URL = ":memory:";

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
 *
 * @param client - The raw sqlite client (not the Drizzle ORM instance),
 *                 because Drizzle ORM doesn't expose `execute()` for raw SQL.
 */
async function runMigrations(client: { execute(sql: string): Promise<unknown> }): Promise<void> {
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
        await client.execute(safeStmt);
      } catch {
        // Skip statements that fail (e.g., index creation if table is partial)
      }
    }
  }
}

export async function setup() {
  // Dynamic import to ensure env vars are set before module-level init.
  // We import sqliteClient directly because Drizzle ORM's db instance
  // does not expose an execute() method — only sqliteClient.execute() works
  // for raw SQL (e.g. running migration DDL).
  const { initializeDatabase, getDatabasePools, sqliteClient } = await import("~/config/db");

  // Initialize database connection (in-memory SQLite)
  await initializeDatabase();

  const pools = getDatabasePools();

  // Verify that the required database (sqlite or pg) is ready.
  // In the test environment, we expect sqlite.
  if (!pools.sqlite && !pools.primary) {
    throw new Error("Database failed to initialize for tests");
  }

  // Create all tables from Drizzle migrations in the in-memory database
  if (!sqliteClient) {
    throw new Error("SQLite client not initialized for test setup");
  }
  try {
    await runMigrations(sqliteClient);
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