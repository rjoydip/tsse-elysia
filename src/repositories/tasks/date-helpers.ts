/**
 * Date helpers for database-agnostic time-based queries.
 * Abstracts SQLite strftime() and PostgreSQL EXTRACT() behind a common interface.
 * Uses lazy env check to avoid import-order issues at module init.
 */

import { sql, type AnyColumn } from "drizzle-orm";

let _dbType: "sqlite" | "postgres" | null = null;

/**
 * Returns the database type from environment, caching it after first call.
 */
async function dbType(): Promise<"sqlite" | "postgres"> {
  if (!_dbType) {
    const { env } = await import("~/config/env");
    _dbType = (env.DATABASE_TYPE || "sqlite") as "sqlite" | "postgres";
  }
  return _dbType;
}

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
export async function monthFromTimestamp(column: AnyColumn) {
  const type = await dbType();
  if (type === "postgres") {
    return sql<number>`EXTRACT(MONTH FROM ${column})`.mapWith(Number);
  }
  return sql<number>`cast(strftime('%m', ${column}, 'unixepoch') as integer)`.mapWith(Number);
}

// Note: yearBoundary was removed because the repo passes raw Date objects
// to gte/lt for dialect-agnostic timestamp comparisons. Date boundaries
// are constructed inline as `new Date(year, 0, 1)`.