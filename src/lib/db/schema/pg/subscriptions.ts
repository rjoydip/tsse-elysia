/**
 * Auto-generated PostgreSQL schema for "subscription" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { subscriptionPlans } from "./subscriptionPlans";
import { users } from "./users";

export const subscriptions = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  planId: text("planId")
    .notNull()
    .references((): AnyPgColumn => subscriptionPlans.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type SubscriptionSelect = typeof subscriptions.$inferSelect;
export type SubscriptionInsert = typeof subscriptions.$inferInsert;