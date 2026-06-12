/**
 * DSL definitions for authentication tables (user, session, account, verification).
 * Single source of truth for auth schema — generates both SQLite and PostgreSQL Drizzle files.
 */

import { defineTable, uid, text, boolean, timestamp } from "./builder";

/**
 * User table - stores authenticated user information.
 */
export const user = defineTable("users", "user", {
  id: uid(),
  name: text(),
  email: { ...text(), notNull: true },
  emailVerified: { ...boolean(), notNull: true, defaultValue: false },
  image: text(),
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
  subscriptionTier: { ...text(), notNull: true, defaultValue: "free" },
  subscriptionId: text(),
  subscriptionStatus: text(),
  subscriptionExpiresAt: timestamp(),
  // Extended user management fields
  firstName: text(),
  lastName: text(),
  username: text(),
  phoneNumber: text(),
  role: { ...text(), notNull: true, defaultValue: "user" },
  status: { ...text(), notNull: true, defaultValue: "active" },
});

/**
 * Session table - stores active user sessions.
 */
export const session = defineTable("sessions", "session", {
  id: uid(),
  expiresAt: { ...timestamp(), notNull: true },
  token: { ...text(), notNull: true, unique: true },
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
  ipAddress: text(),
  userAgent: text(),
  userId: {
    ...text(),
    notNull: true,
    references: { table: "users", column: "id", onDelete: "cascade" },
  },
});

/**
 * Account table - stores OAuth and password credentials.
 */
export const account = defineTable("accounts", "account", {
  id: uid(),
  accountId: { ...text(), notNull: true },
  providerId: { ...text(), notNull: true },
  userId: {
    ...text(),
    notNull: true,
    references: { table: "users", column: "id", onDelete: "cascade" },
  },
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});

/**
 * Verification table - stores email verification and password reset tokens.
 */
export const verification = defineTable("verifications", "verification", {
  id: uid(),
  identifier: { ...text(), notNull: true },
  value: { ...text(), notNull: true },
  expiresAt: { ...timestamp(), notNull: true },
  createdAt: timestamp(),
  updatedAt: timestamp(),
});