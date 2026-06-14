import { beforeAll } from "bun:test";
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Returns all user-defined table names from migration SQL files.
 */
function getMigrationTableNames(): string[] {
  const dir = resolve(realpathSync(import.meta.dir), "../../drizzle");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const tables: string[] = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(?:public\.)?"?([^\s"(]+)/gi;
  for (const f of files) {
    const sql = readFileSync(resolve(dir, f), "utf-8");
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) tables.push(m[1]);
  }
  return [...new Set(tables)];
}

/**
 * Truncates all user tables so each test file starts with clean data.
 */
async function truncateTables(client: { exec(sql: string): Promise<unknown> }): Promise<void> {
  for (const table of getMigrationTableNames()) {
    try {
      await client.exec(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // Ignore
    }
  }
}

/**
 * Sets up PGlite and truncates all tables for a clean test state.
 */
async function setup(): Promise<void> {
  const { initializeDatabase, getDatabasePools } = await import("~/config/db");

  await initializeDatabase();

  const pools = getDatabasePools();
  if (!pools.client && !pools.primary) {
    throw new Error("Database failed to initialize for tests");
  }

  const pgClient = pools.client as { exec(sql: string): Promise<unknown> } | undefined;
  if (!pgClient) throw new Error("Database client not initialized for test setup");

  await truncateTables(pgClient);
}

/**
 * Registers a beforeAll hook that truncates all tables.
 * Call this at module top level in any test file that needs a database.
 */
export function registerSetup(): void {
  beforeAll(setup);
}

/**
 * Cleans up the PGlite database after tests complete.
 *
 * Closes the database connection, resets internal state, removes the
 * persistent data directory, then re-initializes a fresh database.
 *
 * Safe to call in afterAll hooks — subsequent test files in the same process
 * will find a working database instance.
 */
export async function cleanupPgliteDatabase(): Promise<void> {
  try {
    const { resetDatabase } = await import("~/config/db");
    await resetDatabase();
  } catch {
    // Database may not be initialized
  }
}