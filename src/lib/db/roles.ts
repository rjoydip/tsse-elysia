/**
 * Auto-generated PostgreSQL schema for "role" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const roles = pgTable("role", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isDefault: boolean("isDefault").notNull().default(false),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type RoleSelect = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;