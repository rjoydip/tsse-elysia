/**
 * Authentication schema definitions (users, sessions, accounts, verifications).
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * User table - stores authenticated user information.
 * Contains profile data and subscription tier information.
 * Extended with user management fields (role, status, username, phoneNumber).
 */
export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  subscriptionTier: text("subscriptionTier").notNull().default("free"),
  subscriptionId: text("subscriptionId"),
  subscriptionStatus: text("subscriptionStatus"),
  subscriptionExpiresAt: integer("subscriptionExpiresAt", { mode: "timestamp" }),
  // Extended user management fields
  firstName: text("firstName"),
  lastName: text("lastName"),
  username: text("username"),
  phoneNumber: text("phoneNumber"),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
});

/**
 * Session table - stores active user sessions.
 * Links to users and tracks session metadata (IP, user agent).
 */
export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

/**
 * Account table - stores OAuth and password credentials.
 * Links to users and tracks external provider accounts.
 */
export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * Verification table - stores email verification and password reset tokens.
 * Temporary records that expire after use or timeout.
 */
export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

/**
 * User relations - defines one-to-many relationships from users.
 * A user can have multiple sessions, accounts, and subscriptions.
 */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

/**
 * Session relations - defines many-to-one relationship to users.
 * Each session belongs to exactly one user.
 */
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

/**
 * Account relations - defines many-to-one relationship to users.
 * Each account (OAuth provider) belongs to exactly one user.
 */
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

/**
 * User type for runtime use.
 */
export type User = typeof users.$inferSelect;

/**
 * Session type for runtime use.
 */
export type Session = typeof sessions.$inferSelect;

/**
 * Account type for runtime use.
 */
export type Account = typeof accounts.$inferSelect;

/**
 * Verification type for runtime use.
 */
export type Verification = typeof verifications.$inferSelect;