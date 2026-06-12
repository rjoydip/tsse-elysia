/**
 * Auto-generated SQLite schema for "user" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
  firstName: text("firstName"),
  lastName: text("lastName"),
  username: text("username"),
  phoneNumber: text("phoneNumber"),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;