/**
 * Auto-generated SQLite schema for "permission" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const permissions = sqliteTable("permission", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type PermissionSelect = typeof permissions.$inferSelect;
export type PermissionInsert = typeof permissions.$inferInsert;