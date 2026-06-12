/**
 * Auto-generated SQLite schema for "user_settings_notifications" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const userSettingsNotifications = sqliteTable("user_settings_notifications", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["all", "mentions", "none"] })
    .notNull()
    .default("all"),
  mobile: integer("mobile", { mode: "boolean" }).notNull().default(false),
  communicationEmails: integer("communicationEmails", { mode: "boolean" }).notNull().default(false),
  socialEmails: integer("socialEmails", { mode: "boolean" }).notNull().default(true),
  marketingEmails: integer("marketingEmails", { mode: "boolean" }).notNull().default(false),
  securityEmails: integer("securityEmails", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type UserSettingsNotificationSelect = typeof userSettingsNotifications.$inferSelect;
export type UserSettingsNotificationInsert = typeof userSettingsNotifications.$inferInsert;