/**
 * Date helpers for PostgreSQL time-based queries.
 * Uses EXTRACT() which works in all supported PG environments.
 */

import { sql, type AnyColumn } from "drizzle-orm";

/**
 * Returns a SQL expression that extracts the month number (1–12) from a
 * timestamp column.
 *
 * @example
 *   const monthCol = monthFromTimestamp(tasks.createdAt);
 *   // PG:      EXTRACT(MONTH FROM tasks.createdAt)
 */
export function monthFromTimestamp(column: AnyColumn) {
  return sql<number>`EXTRACT(MONTH FROM ${column})`.mapWith(Number);
}

// Note: yearBoundary was removed because the repo passes raw Date objects
// to gte/lt for dialect-agnostic timestamp comparisons. Date boundaries
// are constructed inline as `new Date(year, 0, 1)`.