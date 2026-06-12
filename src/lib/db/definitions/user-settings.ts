/**
 * DSL definitions for user settings tables (profile, account, display, notifications).
 * Single source of truth for user settings schema.
 */

import { defineTable, uid, text, timestamp, boolean as bool, enum_ } from "./builder";

/**
 * User Settings Profile table - stores user profile settings.
 */
export const userSettingsProfile = defineTable("userSettingsProfile", "user_settings_profile", {
  id: uid(),
  userId: {
    ...text(),
    notNull: true,
    references: { table: "users", column: "id", onDelete: "cascade" },
  },
  username: { ...text(), notNull: true },
  email: { ...text(), notNull: true, defaultValue: "" },
  bio: { ...text(), notNull: true, defaultValue: "" },
  urls: { ...text(), notNull: true, defaultValue: "[]" },
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});

/**
 * User Settings Account table - stores account settings.
 */
export const userSettingsAccount = defineTable("userSettingsAccount", "user_settings_account", {
  id: uid(),
  userId: {
    ...text(),
    notNull: true,
    references: { table: "users", column: "id", onDelete: "cascade" },
  },
  name: { ...text(), notNull: true, defaultValue: "" },
  dob: timestamp(),
  language: { ...text(), notNull: true, defaultValue: "en" },
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});

/**
 * User Settings Display table - stores display preferences.
 */
export const userSettingsDisplay = defineTable("userSettingsDisplay", "user_settings_display", {
  id: uid(),
  userId: {
    ...text(),
    notNull: true,
    references: { table: "users", column: "id", onDelete: "cascade" },
  },
  items: { ...text(), notNull: true, defaultValue: '["recents","home"]' },
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});

/**
 * User Settings Notifications table - stores notification preferences.
 */
export const userSettingsNotifications = defineTable(
  "userSettingsNotifications",
  "user_settings_notifications",
  {
    id: uid(),
    userId: {
      ...text(),
      notNull: true,
      references: { table: "users", column: "id", onDelete: "cascade" },
    },
    type: {
      ...enum_(["all", "mentions", "none"] as const),
      notNull: true,
      defaultValue: "all",
    },
    mobile: { ...bool(), notNull: true, defaultValue: false },
    communicationEmails: { ...bool(), notNull: true, defaultValue: false },
    socialEmails: { ...bool(), notNull: true, defaultValue: true },
    marketingEmails: { ...bool(), notNull: true, defaultValue: false },
    securityEmails: { ...bool(), notNull: true, defaultValue: true },
    createdAt: { ...timestamp(), notNull: true },
    updatedAt: { ...timestamp(), notNull: true },
  },
);