/**
 * Auto-generated SQLite schema for "service_health" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const serviceHealth = sqliteTable("service_health", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceName: text("service_name").notNull(),
  status: text("status").notNull(),
  latencyMs: integer("latency_ms"),
  error: text("error"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export type ServiceHealthSelect = typeof serviceHealth.$inferSelect;
export type ServiceHealthInsert = typeof serviceHealth.$inferInsert;