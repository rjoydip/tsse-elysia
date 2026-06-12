/**
 * Auto-generated PostgreSQL schema for "service_health" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";

export const serviceHealth = pgTable("service_health", {
  id: serial("id"),
  serviceName: text("service_name").notNull(),
  status: text("status").notNull(),
  latencyMs: integer("latency_ms"),
  error: text("error"),
  timestamp: timestamp("timestamp").notNull(),
});

export type ServiceHealthSelect = typeof serviceHealth.$inferSelect;
export type ServiceHealthInsert = typeof serviceHealth.$inferInsert;