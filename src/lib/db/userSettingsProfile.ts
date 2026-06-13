/**
 * Auto-generated PostgreSQL schema for "user_settings_profile" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userSettingsProfile = pgTable("user_settings_profile", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  email: text("email").notNull().default(""),
  bio: text("bio").notNull().default(""),
  urls: text("urls").notNull().default("[]"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type UserSettingsProfileSelect = typeof userSettingsProfile.$inferSelect;
export type UserSettingsProfileInsert = typeof userSettingsProfile.$inferInsert;