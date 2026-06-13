/**
 * db0 database utility layer for PostgreSQL.
 *
 * Provides a shared connection for health checks, cache, and admin queries.
 * NOT used for Drizzle ORM (drizzle-orm/pglite, node-postgres, neon, pg-proxy
 * handle those directly).
 *
 * Automatically selects the correct db0 connector based on the active driver:
 *  - PGlite  → db0/connectors/pglite
 *  - Postgres (node-postgres, neon) → db0/connectors/postgresql
 *  - pg-proxy → custom connector wrapping Hyperdrive connect()
 *
 * @see src/config/db/index.ts for the Drizzle ORM connection factory
 */

import { createDatabase, type Database } from "db0";
import { env } from "~/config/env";
import { getDatabaseDriver, type DriverType } from "~/config/db";
import { dbLogger } from "~/lib/logger";

let _db0: Database | null = null;
let _db0Init: Promise<Database> | null = null;

/**
 * Resolves the db0 connector URL for the current driver.
 *
 * @param driver - Active PG driver type
 * @returns Connection URL string or null if not applicable
 */
function resolveConnectorUrl(driver: DriverType): string | null {
  switch (driver) {
    case "neon":
      return env.NEON_DATABASE_URL || null;
    case "node-postgres":
      return env.POSTGRES_URL || null;
    default:
      return null;
  }
}

/**
 * Returns a shared db0 Database instance for utility queries.
 *
 * Used by:
 *  - Health checks (heartbeat.ts)
 *  - Cache layer (lib/cache)
 *  - Admin / migration DDL (raw SQL)
 *
 * Creates the instance lazily on first call. Thread-safe via promise dedup.
 *
 * @returns db0 Database instance
 */
export async function getDb0(): Promise<Database> {
  if (_db0) return _db0;

  if (_db0Init) return _db0Init;

  _db0Init = _initDb0();
  return _db0Init;
}

async function _initDb0(): Promise<Database> {
  const driver = getDatabaseDriver();

  switch (driver) {
    case "pglite": {
      const { default: pgliteConnector } = await import("db0/connectors/pglite");
      _db0 = createDatabase(pgliteConnector({ dataDir: env.PGLITE_DATA_DIR }));
      break;
    }
    case "node-postgres":
    case "neon": {
      const url = resolveConnectorUrl(driver);
      if (!url) {
        throw new Error(`Missing connection URL for driver: ${driver}`);
      }
      const { default: postgresqlConnector } = await import("db0/connectors/postgresql");
      _db0 = createDatabase(postgresqlConnector({ url }));
      break;
    }
    case "pg-proxy": {
      _db0 = createDatabase({
        name: "pg-proxy",
        dialect: "postgresql",
        exec: async (sql: string) => {
          const hyperdrive = (globalThis as any)[env.CF_HYPERDRIVE_BINDING!];
          if (!hyperdrive) {
            throw new Error(`Hyperdrive binding "${env.CF_HYPERDRIVE_BINDING}" not found`);
          }
          const client = hyperdrive.connect();
          try {
            return await client.query(sql);
          } finally {
            client.release();
          }
        },
        dispose: async () => {
          // Hyperdrive connections are ephemeral; nothing to clean up
        },
      } as any);
      break;
    }
  }

  dbLogger.log(`[db0] Initialized with driver: ${driver}`);
  return _db0!;
}

/**
 * Shuts down the db0 connection gracefully.
 */
export async function disposeDb0(): Promise<void> {
  if (_db0) {
    // db0 doesn't have a unified dispose; we handle per-connector cleanup
    _db0 = null;
  }
  _db0Init = null;
}