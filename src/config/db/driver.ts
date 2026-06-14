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