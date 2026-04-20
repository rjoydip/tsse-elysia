/**
 * Database schema definitions using Drizzle ORM.
 * Defines tables for users, sessions, accounts, and subscriptions.
 * Includes relational definitions for foreign key connections.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

/**
 * User table - stores authenticated user information.
 * Contains profile data and subscription tier information.
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
 * Subscription Plans table - defines available pricing tiers.
 * Contains plan details and rate limiting configuration.
 */
export const subscriptionPlans = sqliteTable("subscription_plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  interval: text("interval").notNull(),
  intervalCount: integer("intervalCount").notNull().default(1),
  features: text("features"),
  rateLimit: integer("rateLimit").notNull(),
  rateLimitDuration: integer("rateLimitDuration").notNull().default(60_000),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * Subscriptions table - tracks user subscription status.
 * Links users to plans and tracks billing period information.
 */
export const subscriptions = sqliteTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("planId")
    .notNull()
    .references(() => subscriptionPlans.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  currentPeriodStart: integer("currentPeriodStart", { mode: "timestamp" }).notNull(),
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp" }).notNull(),
  cancelAtPeriodEnd: integer("cancelAtPeriodEnd", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * User relations - defines one-to-many relationships from users.
 * A user can have multiple sessions, accounts, and subscriptions.
 */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  subscriptions: many(subscriptions),
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
 * Subscription relations - defines many-to-one relationships.
 * Each subscription belongs to one user and references one plan.
 */
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

// Type exports for runtime type inference
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type McpApiKey = typeof mcpApiKeys.$inferSelect;
export type ServiceHealth = typeof serviceHealth.$inferSelect;

// Union type for all table types
export type DBType =
  | typeof users
  | typeof sessions
  | typeof accounts
  | typeof verifications
  | typeof subscriptionPlans
  | typeof subscriptions
  | typeof mcpApiKeys
  | typeof serviceHealth;

/**
 * MCP API Keys table - stores API keys for MCP client authentication.
 * Allows external AI agents to access the application via MCP protocol.
 * Keys are hashed before storage for security.
 */
export const mcpApiKeys = sqliteTable("mcp_api_key", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("keyHash").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organizationId"),
  permissions: text("permissions"), // JSON string for tool permissions
  rateLimit: integer("rateLimit").notNull().default(100),
  rateLimitDuration: integer("rateLimitDuration").notNull().default(60_000),
  lastUsedAt: integer("lastUsedAt", { mode: "timestamp" }),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * MCP API Key relations - defines many-to-one relationship to users.
 * Each API key belongs to exactly one user.
 */
export const mcpApiKeysRelations = relations(mcpApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [mcpApiKeys.userId],
    references: [users.id],
  }),
}));

/**
 * Service Health table - stores periodic snapshots of service health.
 * Used for status monitoring and historical health graphs.
 */
export const serviceHealth = sqliteTable("service_health", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceName: text("service_name").notNull(),
  status: text("status", { enum: ["up", "down", "degraded"] }).notNull(),
  latencyMs: integer("latency_ms"),
  error: text("error"),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});