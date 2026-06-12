/**
 * Auto-generated SQLite schema for "user_settings_profile" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const userSettingsProfile = sqliteTable("user_settings_profile", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  email: text("email").notNull().default(""),
  bio: text("bio").notNull().default(""),
  urls: text("urls").notNull().default("[]"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type UserSettingsProfileSelect = typeof userSettingsProfile.$inferSelect;
export type UserSettingsProfileInsert = typeof userSettingsProfile.$inferInsert;