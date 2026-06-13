/**
 * Auto-generated PostgreSQL schema for "user_settings_account" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userSettingsAccount = pgTable("user_settings_account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  dob: timestamp("dob"),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type UserSettingsAccountSelect = typeof userSettingsAccount.$inferSelect;
export type UserSettingsAccountInsert = typeof userSettingsAccount.$inferInsert;