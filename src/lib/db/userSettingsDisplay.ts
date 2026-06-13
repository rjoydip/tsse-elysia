/**
 * Auto-generated PostgreSQL schema for "user_settings_display" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userSettingsDisplay = pgTable("user_settings_display", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  items: text("items").notNull().default('["recents","home"]'),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type UserSettingsDisplaySelect = typeof userSettingsDisplay.$inferSelect;
export type UserSettingsDisplayInsert = typeof userSettingsDisplay.$inferInsert;