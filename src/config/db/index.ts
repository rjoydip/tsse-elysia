/**
 * Database connection and initialization using Drizzle ORM with LibSQL.
 * Supports SQLite (local/in-memory/Turso) and PostgreSQL based on environment.
 *
 * SQLite Configuration:
 * - If SQLITE_URL is set, use it (supports Turso, file paths, etc.)
 * - If POSTGRES_URL is set, use it (Superbase, file paths, etc.)
 * - Otherwise use sqlite database (`fallback`)
 *
 * PostgreSQL Configuration:
 * - Used in production when POSTGRES_URL is available
 * - Supports read replicas via POSTGRES_REPLICAS env var
 *
 * Only initializes on server-side (typeof window === "undefined")
 * to prevent client-side bundle from including database code.
 */

import { createClient, type Client } from "@libsql/client";
import { Pool } from "pg";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "~/schema/core";
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
 * PostgreSQL read replica pools - dynamic array based on env config
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
 * 1. If SQLITE_URL is set -> SQLite (supports Turso or file)
 * 2. If POSTGRES_URL is set (non-dev) -> PostgreSQL
 * 3. Otherwise -> SQLite (in-memory)
 *
 * @returns The configured database type
 */
export function getDatabaseType(): DatabaseType {
  // If SQLITE_URL is explicitly set, use SQLite (Turso, file, etc.)
  if (env.SQLITE_URL) {
    return "sqlite";
  }

  // CI always uses SQLite regardless of DATABASE_TYPE setting
  if (isCI) {
    return "sqlite";
  }

  // Check DATABASE_TYPE env var, default to sqlite
  const dbType = env.DATABASE_TYPE || "sqlite";

  // Local development: respect DATABASE_TYPE flag
  if (isDev) {
    if (dbType === "postgres" && env.POSTGRES_URL) {
      return "postgres";
    }
    return "sqlite";
  }

  // Stage/QA/Prod: use PostgreSQL if URL is available
  if ((isStage || isQA || isProduction) && env.POSTGRES_URL) {
    return "postgres";
  }

  // Default fallback to SQLite
  return "sqlite";
}

/**
 * Creates a SQLite database connection using LibSQL client.
 * Supports file-based, in-memory, and Turso/remote databases.
 * Falls back to in-memory database if SQLITE_URL is not set.
 *
 * @returns SQLite database client and Drizzle ORM
 */
export function createSQLiteConnection(): {
  sqliteClient: Client;
  db: typeof db;
} {
  const url = env.SQLITE_URL || ":memory:";
  const authToken = env.SQLITE_AUTH_TOKEN;

  // Use LibSQL client for SQLite
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
function createPostgresConnection(): {
  pgPoolPrimary: Pool;
  pgPoolsReplicas: Pool[];
  db: typeof db;
} {
  const connectionString = env.POSTGRES_URL || buildPostgresConnectionString();

  // Primary (write) pool
  pgPoolPrimary = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Dynamic read replicas from POSTGRES_REPLICAS env var (JSON array)
  const replicaUrls: string[] = env.POSTGRES_REPLICAS || [];
  pgPoolsReplicas = replicaUrls.map((url: string) => {
    return new Pool({
      connectionString: url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  });

  // Primary (write) Drizzle instance
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
export function getReadDb() {
  // No replicas configured, use primary
  if (pgPoolsReplicas.length === 0) {
    return db;
  }

  // Round-robin selection between available replicas
  const index = replicaRoundRobinIndex % pgPoolsReplicas.length;
  replicaRoundRobinIndex++;
  const selectedPool = pgPoolsReplicas[index];

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

  // Primary pool (always for writes)
  if (pgPoolPrimary) {
    configs.push({
      name: "primary",
      role: "primary",
      url: env.POSTGRES_URL || buildPostgresConnectionString(),
    });
  }

  // Replica pools
  const replicaUrls: string[] = env.POSTGRES_REPLICAS || [];

  // If no replicas configured, primary also serves reads
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
 * This function handles the decision between SQLite and PostgreSQL.
 *
 * @returns The initialized Drizzle ORM instance
 */
export function initializeDatabase() {
  if (db) return db; // Return existing instance if already initialized

  const dbType = getDatabaseType();

  // Initialize only in server-side context
  if (typeof window !== "undefined") {
    dbLogger.warn("Database initialization skipped: client-side context");
    return db;
  }

  switch (dbType) {
    case "postgres":
      dbLogger.log("[DB] Using PostgreSQL");
      createPostgresConnection();
      break;
    case "sqlite":
    default:
      createSQLiteConnection();
      break;
  }

  return db;
}

// Initialize database on module load (server-side only)
if (typeof window === "undefined") {
  initializeDatabase();
}

// Export for use in other modules (auth, migrations, etc.)
export { sqliteClient, pgPoolPrimary, pgPoolsReplicas, db, schema };
export type DbType = NonNullable<typeof db>;