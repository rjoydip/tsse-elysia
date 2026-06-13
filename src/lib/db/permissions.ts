/**
 * Auto-generated PostgreSQL schema for "permission" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const permissions = pgTable("permission", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type PermissionSelect = typeof permissions.$inferSelect;
export type PermissionInsert = typeof permissions.$inferInsert;