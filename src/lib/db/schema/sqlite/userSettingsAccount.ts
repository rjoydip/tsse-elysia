/**
 * Auto-generated SQLite schema for "user_settings_account" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const userSettingsAccount = sqliteTable("user_settings_account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  dob: integer("dob", { mode: "timestamp" }),
  language: text("language").notNull().default("en"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type UserSettingsAccountSelect = typeof userSettingsAccount.$inferSelect;
export type UserSettingsAccountInsert = typeof userSettingsAccount.$inferInsert;