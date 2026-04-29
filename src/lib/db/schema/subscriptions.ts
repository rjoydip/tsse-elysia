/**
 * Subscription schema definitions (subscriptionPlans, subscriptions).
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

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
 * User relations - adds subscriptions to user's relations.
 */
export const usersSubscriptionsRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
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

/**
 * Subscription Plan type for runtime use.
 */
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

/**
 * Subscription type for runtime use.
 */
export type Subscription = typeof subscriptions.$inferSelect;