/**
 * Auto-generated PostgreSQL schema for "user_settings_notifications" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userSettingsNotifications_type = pgEnum("user_settings_notifications_type", [
  "all",
  "mentions",
  "none",
]);

export const userSettingsNotifications = pgTable("user_settings_notifications", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  type: userSettingsNotifications_type("type").notNull().default("all"),
  mobile: boolean("mobile").notNull().default(false),
  communicationEmails: boolean("communicationEmails").notNull().default(false),
  socialEmails: boolean("socialEmails").notNull().default(true),
  marketingEmails: boolean("marketingEmails").notNull().default(false),
  securityEmails: boolean("securityEmails").notNull().default(true),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type UserSettingsNotificationSelect = typeof userSettingsNotifications.$inferSelect;
export type UserSettingsNotificationInsert = typeof userSettingsNotifications.$inferInsert;