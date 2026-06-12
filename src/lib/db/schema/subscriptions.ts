/**
 * Subscriptions schema — proxy re-exporting generated SQLite tables with relations.
 * Tables are generated from portable DSL definitions.
 */

import { relations } from "drizzle-orm";

import { users } from "./sqlite/users";
import { subscriptionPlans } from "./sqlite/subscriptionPlans";
import { subscriptions } from "./sqlite/subscriptions";

export { subscriptionPlans, subscriptions };

export const usersSubscriptionsRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

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

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;