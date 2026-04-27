/**
 * User settings schema definitions (profile, account, display, notifications).
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

/**
 * User Settings Profile table - stores user profile settings.
 * Contains username, bio, and social URLs.
 */
export const userSettingsProfile = sqliteTable("user_settings_profile", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  email: text("email").notNull().default(""),
  bio: text("bio").notNull().default(""),
  urls: text("urls").notNull().default("[]"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * User Settings Account table - stores account settings.
 * Contains name, date of birth, and language preference.
 */
export const userSettingsAccount = sqliteTable("user_settings_account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  dob: integer("dob", { mode: "timestamp" }),
  language: text("language").notNull().default("en"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * User Settings Display table - stores display preferences.
 * Contains sidebar item configuration.
 */
export const userSettingsDisplay = sqliteTable("user_settings_display", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  items: text("items").notNull().default('["recents","home"]'),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * User Settings Notifications table - stores notification preferences.
 * Contains email and mobile notification settings.
 */
export const userSettingsNotifications = sqliteTable("user_settings_notifications", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

/**
 * User Settings Profile relations - defines many-to-one relationship to users.
 */
export const userSettingsProfileRelations = relations(userSettingsProfile, ({ one }) => ({
  user: one(users, {
    fields: [userSettingsProfile.userId],
    references: [users.id],
  }),
}));

/**
 * User Settings Account relations - defines many-to-one relationship to users.
 */
export const userSettingsAccountRelations = relations(userSettingsAccount, ({ one }) => ({
  user: one(users, {
    fields: [userSettingsAccount.userId],
    references: [users.id],
  }),
}));

/**
 * User Settings Display relations - defines many-to-one relationship to users.
 */
export const userSettingsDisplayRelations = relations(userSettingsDisplay, ({ one }) => ({
  user: one(users, {
    fields: [userSettingsDisplay.userId],
    references: [users.id],
  }),
}));

/**
 * User Settings Notifications relations - defines many-to-one relationship to users.
 */
export const userSettingsNotificationsRelations = relations(
  userSettingsNotifications,
  ({ one }) => ({
    user: one(users, {
      fields: [userSettingsNotifications.userId],
      references: [users.id],
    }),
  }),
);

/**
 * User Settings Profile type for runtime use.
 */
export type UserSettingsProfile = typeof userSettingsProfile.$inferSelect;

/**
 * User Settings Account type for runtime use.
 */
export type UserSettingsAccount = typeof userSettingsAccount.$inferSelect;

/**
 * User Settings Display type for runtime use.
 */
export type UserSettingsDisplay = typeof userSettingsDisplay.$inferSelect;

/**
 * User Settings Notifications type for runtime use.
 */
export type UserSettingsNotifications = typeof userSettingsNotifications.$inferSelect;