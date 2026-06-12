/**
 * Auto-generated SQLite schema for "user_settings_display" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const userSettingsDisplay = sqliteTable("user_settings_display", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: "cascade" }),
  items: text("items").notNull().default('["recents","home"]'),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type UserSettingsDisplaySelect = typeof userSettingsDisplay.$inferSelect;
export type UserSettingsDisplayInsert = typeof userSettingsDisplay.$inferInsert;