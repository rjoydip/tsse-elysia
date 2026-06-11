/**
 * Date helpers for database-agnostic time-based queries.
 * Abstracts SQLite strftime() and PostgreSQL EXTRACT() behind a common interface.
 * The env config is imported statically — it's process-level data, not affected by HMR.
 */

import { sql, type AnyColumn } from "drizzle-orm";
import { env } from "~/config/env";

const DB_TYPE = (env.DATABASE_TYPE || "sqlite") as "sqlite" | "postgres";

/**
 * Returns a SQL expression that extracts the month number (1–12) from a
 * timestamp column. Works for both SQLite (unix-epoch integers) and
 * PostgreSQL (native TIMESTAMP).
 *
 * @example
 *   const monthCol = monthFromTimestamp(tasks.createdAt);
 *   // SQLite:  cast(strftime('%m', tasks.createdAt, 'unixepoch') as integer)
 *   // PG:      EXTRACT(MONTH FROM tasks.createdAt)
 */
export function monthFromTimestamp(column: AnyColumn) {
  if (DB_TYPE === "postgres") {
    return sql<number>`EXTRACT(MONTH FROM ${column})`.mapWith(Number);
  }
  return sql<number>`cast(strftime('%m', ${column}, 'unixepoch') as integer)`.mapWith(Number);
}

// Note: yearBoundary was removed because the repo passes raw Date objects
// to gte/lt for dialect-agnostic timestamp comparisons. Date boundaries
// are constructed inline as `new Date(year, 0, 1)`.