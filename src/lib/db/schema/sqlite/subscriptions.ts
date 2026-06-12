/**
 * Auto-generated SQLite schema for "subscription" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { subscriptionPlans } from "./subscriptionPlans";
import { users } from "./users";

export const subscriptions = sqliteTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: "cascade" }),
  planId: text("planId")
    .notNull()
    .references((): AnySQLiteColumn => subscriptionPlans.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  currentPeriodStart: integer("currentPeriodStart", { mode: "timestamp" }).notNull(),
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp" }).notNull(),
  cancelAtPeriodEnd: integer("cancelAtPeriodEnd", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type SubscriptionSelect = typeof subscriptions.$inferSelect;
export type SubscriptionInsert = typeof subscriptions.$inferInsert;