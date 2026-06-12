/**
 * Auto-generated PostgreSQL schema for "user" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  subscriptionTier: text("subscriptionTier").notNull().default("free"),
  subscriptionId: text("subscriptionId"),
  subscriptionStatus: text("subscriptionStatus"),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  firstName: text("firstName"),
  lastName: text("lastName"),
  username: text("username"),
  phoneNumber: text("phoneNumber"),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;