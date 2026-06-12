/**
 * Database connection and initialization using Drizzle ORM with LibSQL.
 * Supports SQLite (local/in-memory/Turso) and PostgreSQL based on environment.
 *
 * SQLite uses @libsql/client + drizzle-orm/libsql directly for full schema support.
 * PostgreSQL uses pg pool + drizzle-orm/node-postgres with read-replica support.
 *
 * Only initializes on server-side (typeof window === "undefined")
 * to prevent client-side bundle from including database code.
 */

import { createClient, type Client } from "@libsql/client";
import type { Pool } from "pg";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import * as schema from "~/lib/db/schema";
import { env } from "~/config/env";
import { isCI, isDev, isStage, isQA, isProduction } from "~/config";
import { dbLogger } from "~/lib/logger";

/**
 * Database type based on environment configuration.
 */
export type DatabaseType = "sqlite" | "postgres";

/**
 * Database pool configuration for health checks.
 */
export interface DatabasePoolConfig {
  name: string;
  role: "primary" | "replica";
  url: string;
}

/**
 * LibSQL database client for SQLite
 */
let sqliteClient: Client | undefined;

/**
 * PostgreSQL primary (write) pool instance
 */
let pgPoolPrimary: Pool | undefined;

/**
 * PostgreSQL read replica pools — dynamic array based on env config
 */
let pgPoolsReplicas: Pool[] = [];

/**
 * Round-robin index for replica selection
 */
let replicaRoundRobinIndex = 0;

/**
 * Drizzle ORM instance with typed schema (primary/write)
 */
let db: any;

/**
 * Gets the database type based on environment configuration.
 *
 * Priority order:
 * 1. If SQLITE_URL is set → SQLite (supports Turso or file)
 * 2. If POSTGRES_URL is set (non-dev) → PostgreSQL
 * 3. Otherwise → SQLite (in-memory)
 *
 * @returns The configured database type
 */
export function getDatabaseType(): DatabaseType {
  if (env.SQLITE_URL) {
    return "sqlite";
  }
  if (isCI) {
    return "sqlite";
  }
  const dbType = env.DATABASE_TYPE || "sqlite";
  if (isDev) {
    if (dbType === "postgres" && env.POSTGRES_URL) {
      return "postgres";
    }
    return "sqlite";
  }
  if ((isStage || isQA || isProduction) && env.POSTGRES_URL) {
    return "postgres";
  }
  return "sqlite";
}

/**
 * Creates a SQLite database connection using LibSQL client.
 * Falls back to in-memory database if SQLITE_URL is not set.
 *
 * @returns SQLite database client and Drizzle ORM
 */
function createSQLiteConnection(): {
  sqliteClient: Client;
  db: typeof db;
} {
  const url = env.SQLITE_URL || ":memory:";
  const authToken = env.SQLITE_AUTH_TOKEN;

  sqliteClient = createClient({
    url,
    authToken,
  });

  db = drizzleLibsql(sqliteClient, {
    schema,
  });

  dbLogger.log(`[DB] Using SQLite: ${url === ":memory:" ? "in-memory" : url}`);

  return { sqliteClient, db };
}

/**
 * Creates a PostgreSQL connection pool with primary and read replicas.
 *
 * @returns PostgreSQL pools and Drizzle ORM instances
 */
async function createPostgresConnection(): Promise<{
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

  db = drizzlePg(pgPoolPrimary, {
    schema,
  });

  return { pgPoolPrimary, pgPoolsReplicas, db };
}

/**
 * Builds PostgreSQL connection string from individual env vars.
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

  const index = replicaRoundRobinIndex % pgPoolsReplicas.length;
  replicaRoundRobinIndex++;
  const selectedPool = pgPoolsReplicas[index];

  const { drizzle: drizzlePg } = await import("drizzle-orm/node-postgres");

  return drizzlePg(selectedPool, {
    schema,
  });
}

/**
 * Returns all database pools for health checks.
 *
 * @returns Object containing all database pools/instances
 */
export function getDatabasePools() {
  return {
    primary: pgPoolPrimary,
    replicas: pgPoolsReplicas,
    sqlite: sqliteClient,
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

  if (pgPoolPrimary) {
    configs.push({
      name: "primary",
      role: "primary",
      url: env.POSTGRES_URL || buildPostgresConnectionString(),
    });
  }

  const replicaUrls: string[] = env.POSTGRES_REPLICAS || [];

  if (replicaUrls.length === 0 && pgPoolPrimary) {
    configs.push({
      name: "primary-read",
      role: "replica",
      url: env.POSTGRES_URL || buildPostgresConnectionString(),
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
 * Handles the decision between SQLite and PostgreSQL.
 *
 * @returns The initialized Drizzle ORM instance
 */
export async function initializeDatabase() {
  if (db) return db;

  const dbType = getDatabaseType();

  if (typeof window !== "undefined") {
    dbLogger.warn("Database initialization skipped: client-side context");
    return db;
  }

  switch (dbType) {
    case "postgres":
      dbLogger.log("[DB] Using PostgreSQL");
      await createPostgresConnection();
      break;
    case "sqlite":
    default:
      createSQLiteConnection();
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
const DB_SQLITE_KEY = "___tsse_elysia_sqlite_client";
const DB_PG_PRIMARY_KEY = "___tsse_elysia_pg_primary";
const DB_PG_REPLICAS_KEY = "___tsse_elysia_pg_replicas";

if (typeof window === "undefined") {
  const globalStore = globalThis as Record<string, unknown>;

  if (globalStore[DB_INSTANCE_KEY]) {
    db = globalStore[DB_INSTANCE_KEY] as typeof db;
    sqliteClient = globalStore[DB_SQLITE_KEY] as typeof sqliteClient;
    pgPoolPrimary = globalStore[DB_PG_PRIMARY_KEY] as typeof pgPoolPrimary;
    pgPoolsReplicas = globalStore[DB_PG_REPLICAS_KEY] as typeof pgPoolsReplicas;
  }

  if (!globalStore[DB_INIT_KEY]) {
    globalStore[DB_INIT_KEY] = true;
    await initializeDatabase();

    globalStore[DB_INSTANCE_KEY] = db;
    globalStore[DB_SQLITE_KEY] = sqliteClient;
    globalStore[DB_PG_PRIMARY_KEY] = pgPoolPrimary;
    globalStore[DB_PG_REPLICAS_KEY] = pgPoolsReplicas;
  }
}

export { sqliteClient, pgPoolPrimary, pgPoolsReplicas, db, schema };
export type DbType = NonNullable<typeof db>;