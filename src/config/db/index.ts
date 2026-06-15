/**
 * Database connection and initialization with Drizzle ORM and PostgreSQL.
 *
 * Supports 4 runtime drivers selected by environment:
 *  1. PGlite (WASM)  — local dev (persistent via PGLITE_DATA_DIR, default .artifacts/pglite-data)
 *  2. node-postgres   — Docker / VPS (via POSTGRES_URL)
 *  3. neon-serverless — Neon / Supabase (via NEON_DATABASE_URL)
 *  4. pg-proxy        — Cloudflare Workers (via CF_HYPERDRIVE_BINDING)
 *
 * Read-replica support for node-postgres (POSTGRES_REPLICAS) and Neon.
 *
 * Only initializes on server-side (typeof window === "undefined")
 * to prevent client-side bundle from including database code.
 */

import { rmSync } from "node:fs";
import { resolve } from "node:path";
import type { Pool } from "pg";
import * as schema from "~/lib/db";
import { env } from "~/config/env";
import { dbLogger } from "~/lib/logger";
import { getDatabaseDriver, execViaHyperdrive } from "./driver";

/**
 * Database pool configuration for health checks.
 */
export interface DatabasePoolConfig {
  name: string;
  role: "primary" | "replica";
  url: string;
}

/**
 * Generic DB client — PGlite instance, pg Pool, or neon Pool.
 */
let dbClient: any;

/**
 * PostgreSQL primary (write) Pool (node-postgres / neon)
 */
let pgPoolPrimary: Pool | undefined;

/**
 * PostgreSQL read replica Pools
 */
let pgPoolsReplicas: Pool[] = [];

/**
 * Drizzle ORM instance with typed schema (primary/write)
 */
let db: any;

/**
 * Cached Drizzle ORM instances per replica pool.
 * Avoids creating a new ORM wrapper (schema proxy, query builder) on every
 * read request through a replica. Keyed by pool reference identity.
 */
let replicaDbs = new WeakMap<object, any>();

/**
 * Round-robin index for replica selection
 */
let replicaRoundRobinIndex = 0;

/**
 * Detects the active driver type based on env vars.
 *
 * Priority:
 *  1. CF_HYPERDRIVE_BINDING  → pg-proxy (Cloudflare Workers)
 *  2. NEON_DATABASE_URL       → neon (Neon / Supabase)
 *  3. POSTGRES_URL            → node-postgres (Docker / production)
 *  4. Default                 → pglite (local dev, in-memory or persistent)
 *
 * @returns Detected driver type
 */
/**
 * Builds a PostgreSQL connection string from individual env vars.
 *
 * @returns PostgreSQL connection string
 */
function buildPostgresConnectionString(): string {
  const host = env.POSTGRES_HOST || "localhost";
  const port = env.POSTGRES_PORT || 5432;
  const user = env.POSTGRES_USER || "tsse";
  const password = env.POSTGRES_PASSWORD || "";
  const database = env.POSTGRES_DB || "tsse_dev";
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

/**
 * Creates a PGlite (WASM PostgreSQL) connection.
 * Persistent by default via `.artifacts/pglite-data`; override with PGLITE_DATA_DIR.
 * Applies pending migrations automatically on startup.
 *
 * @returns PGlite client and Drizzle ORM
 */
async function createPgliteConnection(): Promise<{
  dbClient: any;
  db: typeof db;
}> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");

  // Read from process.env first so per-worker temp dirs set by
  // test/setup.ts are honoured even if the env module was cached earlier.
  const dataDir = process.env.PGLITE_DATA_DIR || env.PGLITE_DATA_DIR || ".artifacts/pglite-data";
  const options = { dataDir };
  dbClient = new PGlite(options);
  db = drizzle(dbClient, { schema });

  dbLogger.log(`[DB] Using PGlite: ${dataDir}`);

  // Auto-migrate: apply pending migration SQL so in-memory PGlite
  // always starts with the latest schema, no separate db:migrate needed.
  await migratePglite();

  return { dbClient, db };
}

/**
 * Reads and applies pending SQL migrations from the drizzle/ directory.
 * Uses IF NOT EXISTS / DO blocks for idempotency so it is safe to run
 * on every startup. Delegates to the shared {@link runAllMigrations} from
 * src/lib/db/migrate.ts.
 */
async function migratePglite(): Promise<void> {
  const { getMigrationFiles, runAllMigrations } = await import("~/lib/db/migrate");

  const files = getMigrationFiles();

  if (files.length === 0) {
    dbLogger.log("[DB] No pending migration files");
    return;
  }

  dbLogger.log(`[DB] Running ${files.length} migration(s)...`);
  await runAllMigrations(dbClient as { exec(sql: string): Promise<unknown> });
  dbLogger.log("[DB] Migration complete");
}

/**
 * Creates a node-postgres connection pool with read-replica support.
 *
 * @returns PostgreSQL pools and Drizzle ORM
 */
async function createNodePostgresConnection(): Promise<{
  pgPoolPrimary: Pool;
  pgPoolsReplicas: Pool[];
  db: typeof db;
}> {
  const connectionString = env.POSTGRES_URL || buildPostgresConnectionString();

  const { Pool: PgPool } = await import("pg");

  pgPoolPrimary = new PgPool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const replicaUrls: string[] = env.POSTGRES_REPLICAS || [];
  pgPoolsReplicas = replicaUrls.map((url: string) => {
    return new PgPool({
      connectionString: url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  });

  const { drizzle: drizzlePg } = await import("drizzle-orm/node-postgres");

  db = drizzlePg(pgPoolPrimary, { schema });

  dbLogger.log("[DB] Using node-postgres");
  return { pgPoolPrimary, pgPoolsReplicas, db };
}

/**
 * Creates a Neon serverless connection.
 *
 * @returns Neon pool (stored in dbClient) and Drizzle ORM
 */
async function createNeonConnection(): Promise<{
  db: typeof db;
}> {
  const { Pool: NeonPool } = await import("@neondatabase/serverless");
  const { drizzle: drizzleNeon } = await import("drizzle-orm/neon-serverless");

  const neonPool = new NeonPool({ connectionString: env.NEON_DATABASE_URL });

  dbClient = neonPool;
  db = drizzleNeon(neonPool, { schema });

  dbLogger.log("[DB] Using neon-serverless");
  return { db };
}

/**
 * Creates a Cloudflare pg-proxy connection wrapping Hyperdrive.
 *
 * @returns Drizzle ORM
 */
async function createPgProxyConnection(): Promise<{
  db: typeof db;
}> {
  const { drizzle: drizzleProxy } = await import("drizzle-orm/pg-proxy");

  db = drizzleProxy(
    async (sql: string, params: any[], _method: "all" | "execute" | "values") => {
      const result = await execViaHyperdrive(sql, params);
      return { rows: (result?.rows as any[]) ?? [] };
    },
    { schema },
  );

  dbLogger.log("[DB] Using pg-proxy (Cloudflare Hyperdrive)");
  return { db };
}

/**
 * Returns the write (primary) database instance.
 * For read-heavy workloads, use getReadDb() for read queries.
 *
 * @returns The primary Drizzle ORM instance for write operations
 */
export function getWriteDb() {
  return db;
}

/**
 * Returns a read database instance, routing to available replicas.
 * Uses round-robin selection between available replicas.
 * Falls back to primary if no replicas are configured.
 *
 * @returns A read Drizzle ORM instance (from replica or primary)
 */
export async function getReadDb() {
  if (pgPoolsReplicas.length === 0) {
    return db;
  }

  const index = replicaRoundRobinIndex++ % pgPoolsReplicas.length;
  const selectedPool = pgPoolsReplicas[index];

  // Return cached instance if one exists for this pool
  const cached = replicaDbs.get(selectedPool);
  if (cached) return cached;

  const { drizzle: drizzlePg } = await import("drizzle-orm/node-postgres");

  const readDb = drizzlePg(selectedPool, { schema });
  replicaDbs.set(selectedPool, readDb);
  return readDb;
}

/**
 * Returns all database pools for health checks.
 *
 * @returns Object containing database pools/instances
 */
export function getDatabasePools() {
  return {
    primary: pgPoolPrimary,
    replicas: pgPoolsReplicas,
    client: dbClient,
  };
}

/**
 * Returns database pool configurations for health check reporting.
 * Includes primary and all replicas with their roles and URLs.
 *
 * @returns Array of database pool configurations
 */
export function getDatabasePoolConfigs(): DatabasePoolConfig[] {
  const configs: DatabasePoolConfig[] = [];
  const driver = getDatabaseDriver();

  let primaryUrl: string;

  switch (driver) {
    case "neon":
      primaryUrl = env.NEON_DATABASE_URL!;
      break;
    case "node-postgres":
      primaryUrl = env.POSTGRES_URL || buildPostgresConnectionString();
      break;
    case "pglite":
    default:
      primaryUrl = env.PGLITE_DATA_DIR;
  }

  if (pgPoolPrimary || driver === "pglite" || driver === "pg-proxy") {
    configs.push({
      name: "primary",
      role: "primary",
      url: primaryUrl,
    });
  }

  const replicaUrls: string[] = env.POSTGRES_REPLICAS || [];

  if (replicaUrls.length === 0 && pgPoolPrimary) {
    configs.push({
      name: "primary-read",
      role: "replica",
      url: primaryUrl,
    });
  } else {
    replicaUrls.forEach((url: string, index: number) => {
      configs.push({
        name: `replica-${index + 1}`,
        role: "replica",
        url,
      });
    });
  }

  return configs;
}

/**
 * Initializes the database based on environment configuration.
 * Selects from 4 PG drivers: PGlite, node-postgres, neon, pg-proxy.
 *
 * @returns The initialized Drizzle ORM instance
 */
export async function initializeDatabase() {
  if (db) return db;

  const driver = getDatabaseDriver();

  if (typeof window !== "undefined") {
    dbLogger.warn("Database initialization skipped: client-side context");
    return db;
  }

  switch (driver) {
    case "pglite":
      dbLogger.log("[DB] Driver: PGlite");
      await createPgliteConnection();
      break;
    case "node-postgres":
      dbLogger.log("[DB] Driver: node-postgres");
      await createNodePostgresConnection();
      break;
    case "neon":
      dbLogger.log("[DB] Driver: neon-serverless");
      await createNeonConnection();
      break;
    case "pg-proxy":
      dbLogger.log("[DB] Driver: pg-proxy");
      await createPgProxyConnection();
      break;
  }

  return db;
}

// Initialize database on module load (server-side only).
// Top-level await ensures db is initialized before any dependent module resolves.
// Uses a globalThis key to persist the db instance across Vite HMR cycles
// where module-level state is reset on every file save.
const DB_INIT_KEY = "___tsse_elysia_db_init";
const DB_INSTANCE_KEY = "___tsse_elysia_db_instance";
const DB_CLIENT_KEY = "___tsse_elysia_db_client";
const DB_PG_PRIMARY_KEY = "___tsse_elysia_pg_primary";
const DB_PG_REPLICAS_KEY = "___tsse_elysia_pg_replicas";

if (typeof window === "undefined") {
  const globalStore = globalThis as Record<string, unknown>;

  if (globalStore[DB_INSTANCE_KEY]) {
    db = globalStore[DB_INSTANCE_KEY] as typeof db;
    dbClient = globalStore[DB_CLIENT_KEY];
    pgPoolPrimary = globalStore[DB_PG_PRIMARY_KEY] as typeof pgPoolPrimary;
    pgPoolsReplicas = globalStore[DB_PG_REPLICAS_KEY] as typeof pgPoolsReplicas;
  }

  if (!globalStore[DB_INIT_KEY]) {
    globalStore[DB_INIT_KEY] = true;
    await initializeDatabase();

    globalStore[DB_INSTANCE_KEY] = db;
    globalStore[DB_CLIENT_KEY] = dbClient;
    globalStore[DB_PG_PRIMARY_KEY] = pgPoolPrimary;
    globalStore[DB_PG_REPLICAS_KEY] = pgPoolsReplicas;
  }
}

/**
 * Resets database state for testing.
 * Closes the connection, clears all internal state, and removes the
 * data directory so the next initialization starts fresh.
 *
 * Re-initializes the database after reset so that subsequent test files
 * running in the same process still have a working database instance.
 */
export async function resetDatabase(): Promise<void> {
  // Close the existing PGlite client
  if (dbClient && typeof dbClient.close === "function") {
    try {
      await dbClient.close();
    } catch {}
  }

  // Close any PG pool connections
  if (pgPoolPrimary) {
    try {
      await pgPoolPrimary.end();
    } catch {}
  }
  for (const pool of pgPoolsReplicas) {
    try {
      await pool.end();
    } catch {}
  }

  // Reset module-level variables
  db = undefined as any;
  dbClient = undefined;
  pgPoolPrimary = undefined;
  pgPoolsReplicas = [];
  // WeakMap entries are automatically cleaned up when the pool objects
  // (the keys) are garbage collected. Reassign so old refs are released.
  replicaDbs = new WeakMap();

  // Clear globalThis cache keys so the next initializeDatabase() call
  // runs fresh (the cached singleton would reference a closed client)
  const globalStore = globalThis as Record<string, unknown>;
  delete globalStore[DB_INIT_KEY];
  delete globalStore[DB_INSTANCE_KEY];
  delete globalStore[DB_CLIENT_KEY];
  delete globalStore[DB_PG_PRIMARY_KEY];
  delete globalStore[DB_PG_REPLICAS_KEY];

  // Reset db0 cache so the next heartbeat call creates a fresh connection
  // using the new data directory (avoids 503 from stale instance).
  try {
    const { disposeDb0 } = await import("~/config/db/db0");
    await disposeDb0();
  } catch {
    // db0 module may not be importable in all environments
  }

  // Remove the persistent data directory so the next PGlite instance
  // starts with a clean slate (avoids cross-process corruption).
  // Reads from process.env directly so per-worker temp dirs set by
  // test/setup.ts are honoured even if the env module was cached earlier.
  try {
    const dataDir = process.env.PGLITE_DATA_DIR || env?.PGLITE_DATA_DIR || ".artifacts/pglite-data";
    rmSync(resolve(dataDir), { recursive: true, force: true });
  } catch {
    // Directory may not exist
  }

  // Re-initialize a fresh database so subsequent tests in the same process
  // still have a working db instance and do not hit 500 errors.
  await initializeDatabase();
}

export { dbClient, pgPoolPrimary, pgPoolsReplicas, db, schema };
export type DbType = NonNullable<typeof db>;
export { getDatabaseDriver, type DriverType } from "./driver";