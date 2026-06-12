/**
 * DSL definitions for subscription tables (subscriptionPlan, subscription).
 * Single source of truth for subscription schema.
 */

import { defineTable, uid, text, integer, timestamp, boolean as bool } from "./builder";

/**
 * Subscription Plans table - defines available pricing tiers.
 */
export const subscriptionPlan = defineTable("subscriptionPlans", "subscription_plan", {
  id: uid(),
  name: { ...text(), notNull: true },
  description: text(),
  price: { ...integer(), notNull: true },
  currency: { ...text(), notNull: true, defaultValue: "USD" },
  interval: { ...text(), notNull: true },
  intervalCount: { ...integer(), notNull: true, defaultValue: 1 },
  features: text(),
  rateLimit: { ...integer(), notNull: true },
  rateLimitDuration: { ...integer(), notNull: true, defaultValue: 60_000 },
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});

/**
 * Subscriptions table - tracks user subscription status.
 */
export const subscription = defineTable("subscriptions", "subscription", {
  id: uid(),
  userId: {
    ...text(),
    notNull: true,
    references: { table: "users", column: "id", onDelete: "cascade" },
  },
  planId: {
    ...text(),
    notNull: true,
    references: { table: "subscriptionPlans", column: "id", onDelete: "cascade" },
  },
  status: { ...text(), notNull: true, defaultValue: "active" },
  currentPeriodStart: { ...timestamp(), notNull: true },
  currentPeriodEnd: { ...timestamp(), notNull: true },
  cancelAtPeriodEnd: { ...bool(), notNull: true, defaultValue: false },
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});