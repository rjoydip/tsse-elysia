/**
 * Database driver type detection.
 *
 * Extracted from index.ts to break the circular dependency:
 *   db0.ts → (static import of getDatabaseDriver) → index.ts → (dynamic import of disposeDb0) → db0.ts
 *
 * @see src/config/db/index.ts for the connection factory
 * @see src/config/db/db0.ts for the db0 utility layer
 */

import { env } from "~/config/env";

/**
 * Runtime PostgreSQL driver identifier.
 */
export type DriverType = "pglite" | "node-postgres" | "neon" | "pg-proxy";

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
export function getDatabaseDriver(): DriverType {
  if (env.CF_HYPERDRIVE_BINDING) return "pg-proxy";
  if (env.NEON_DATABASE_URL) return "neon";
  if (env.POSTGRES_URL) return "node-postgres";
  return "pglite";
}

/**
 * Executes a raw SQL query through the Cloudflare Hyperdrive binding.
 *
 * Each call creates a fresh connection (no connection pool in Workers).
 * Shared between the Drizzle ORM proxy connector (index.ts) and the
 * db0 utility layer (db0.ts) to avoid duplicated client acquisition logic.
 *
 * @param sql - SQL query string with $1, $2 ... positional parameters
 * @param params - Parameter values
 * @returns Query result from the Hyperdrive client
 */
export async function execViaHyperdrive(
  sql: string,
  params?: unknown[],
): Promise<{ rows?: unknown[] }> {
  const hyperdrive = (globalThis as Record<string, unknown>)[env.CF_HYPERDRIVE_BINDING!] as
    | {
        connect: () => {
          query: (sql: string, params?: unknown[]) => Promise<{ rows?: unknown[] }>;
          release: () => void;
        };
      }
    | undefined;
  if (!hyperdrive) {
    throw new Error(`Hyperdrive binding "${env.CF_HYPERDRIVE_BINDING}" not found`);
  }
  const client = hyperdrive.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}