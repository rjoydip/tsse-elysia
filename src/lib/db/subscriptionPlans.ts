/**
 * Auto-generated PostgreSQL schema for "subscription_plan" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const subscriptionPlans = pgTable("subscription_plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  interval: text("interval").notNull(),
  intervalCount: integer("intervalCount").notNull().default(1),
  features: text("features"),
  rateLimit: integer("rateLimit").notNull(),
  rateLimitDuration: integer("rateLimitDuration").notNull().default(60000),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type SubscriptionPlanSelect = typeof subscriptionPlans.$inferSelect;
export type SubscriptionPlanInsert = typeof subscriptionPlans.$inferInsert;