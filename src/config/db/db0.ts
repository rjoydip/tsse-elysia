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

import { createDatabase, type Connector, type Database, type Primitive } from "db0";
import { env } from "~/config/env";
import {
  getDatabaseDriver,
  execViaHyperdrive as execHyperdrive,
  type DriverType,
} from "~/config/db/driver";
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

  _db0Init = _initDb0().catch((error) => {
    // Reset the init promise so the next caller can retry.
    // Without this, a transient failure (e.g. data dir locked, filesystem
    // contention with seed process) would permanently poison the singleton.
    _db0Init = null;
    throw error;
  });
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
      /**
       * Creates a PreparedStatement that delegates to execHyperdrive.
       * Hyperdrive does not support actual prepared statements, so each
       * all/run/get call executes the query directly.
       *
       * The raw query executor itself lives in driver.ts and is shared
       * with the Drizzle ORM proxy connector in index.ts to avoid
       * duplicated Hyperdrive client acquisition logic.
       */
      function createBoundStatement(sql: string): import("db0").PreparedStatement {
        return {
          bind: () => createBoundStatement(sql),
          all: async () => {
            const result = (await execHyperdrive(sql)) as { rows?: unknown[] };
            return result.rows ?? [];
          },
          run: async () => {
            await execHyperdrive(sql);
            return { success: true };
          },
          get: async () => {
            const result = (await execHyperdrive(sql)) as { rows?: unknown[] };
            return result.rows?.[0] ?? null;
          },
        };
      }

      const hyperdriveConnector: Connector = {
        name: "pg-proxy",
        dialect: "postgresql",
        getInstance: () => ({}),
        exec: execHyperdrive,
        prepare: (sql: string) => ({
          bind: (..._params: Primitive[]) => createBoundStatement(sql),
          all: async (..._params: Primitive[]) => {
            const result = (await execHyperdrive(sql)) as { rows?: unknown[] };
            return result.rows ?? [];
          },
          run: async (..._params: Primitive[]) => {
            await execHyperdrive(sql);
            return { success: true };
          },
          get: async (..._params: Primitive[]) => {
            const result = (await execHyperdrive(sql)) as { rows?: unknown[] };
            return result.rows?.[0] ?? null;
          },
        }),
        dispose: async () => {
          // Hyperdrive connections are ephemeral; nothing to clean up
        },
      };
      _db0 = createDatabase(hyperdriveConnector);
      break;
    }
  }

  dbLogger.log(`[db0] Initialized with driver: ${driver}`);
  return _db0!;
}

/**
 * Shuts down the db0 connection and clears the singleton.
 *
 * Calls the connector's dispose (closes PGlite WASM, releases PG pool
 * connections, etc.) so resources are not leaked. After disposal, the
 * next call to {@link getDb0} creates a fresh connection.
 */
export async function disposeDb0(): Promise<void> {
  if (_db0) {
    try {
      await _db0.dispose();
    } catch {
      // Connector dispose is best-effort; proceed with nulling refs
    }
    _db0 = null;
  }
  _db0Init = null;
}