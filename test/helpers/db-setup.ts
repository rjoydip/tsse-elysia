import { beforeAll } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Returns all Drizzle PG migration SQL file paths sorted by version.
 */
function getMigrationFiles(): string[] {
  const migrationsDir = resolve(import.meta.dir, "../../drizzle");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files.map((f) => resolve(migrationsDir, f));
}

/**
 * Wraps CREATE TYPE statements with DO blocks for idempotency.
 */
function wrapCreateType(sql: string): string {
  return sql.replace(
    /^(CREATE\s+TYPE\s+.+?;)$/gm,
    (match) => `DO $$ BEGIN\n  ${match}\nEXCEPTION WHEN duplicate_object THEN null;\nEND $$;`,
  );
}

/**
 * Executes all Drizzle PG migration SQL statements against the database.
 */
async function runMigrations(client: { exec(sql: string): Promise<unknown> }): Promise<void> {
  const files = getMigrationFiles();
  for (const filePath of files) {
    const sql = readFileSync(filePath, "utf-8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (let stmt of statements) {
      try {
        stmt = wrapCreateType(stmt);
        stmt = stmt.replace(/^CREATE\s+TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
        await client.exec(stmt);
      } catch {
        // Skip statements that fail idempotently
      }
    }
  }
}

/**
 * Initializes PGlite in-memory database and runs all PG migrations.
 * Must be called inside a beforeAll/beforeEach hook (or at module top level).
 */
async function setup(): Promise<void> {
  const { initializeDatabase, getDatabasePools } = await import("~/config/db");

  await initializeDatabase();

  const pools = getDatabasePools();

  if (!pools.client && !pools.primary) {
    throw new Error("Database failed to initialize for tests");
  }

  const pgClient = pools.client as { exec(sql: string): Promise<unknown> } | undefined;
  if (!pgClient) {
    throw new Error("Database client not initialized for test setup");
  }

  try {
    await runMigrations(pgClient);
  } catch (error) {
    console.warn("Failed to run migrations for tests:", error);
  }
}

/**
 * Registers a beforeAll hook that sets up the PGlite database and runs migrations.
 * Call this at the module top level in any test file that needs a real database.
 */
export function registerSetup(): void {
  beforeAll(setup);
}