/**
 * Auto-generated SQLite schema for "verification" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

export type VerificationSelect = typeof verifications.$inferSelect;
export type VerificationInsert = typeof verifications.$inferInsert;