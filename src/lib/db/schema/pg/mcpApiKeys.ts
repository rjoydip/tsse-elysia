/**
 * Auto-generated PostgreSQL schema for "mcp_api_key" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./users";

export const mcpApiKeys = pgTable("mcp_api_key", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("keyHash").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  organizationId: text("organizationId"),
  permissions: text("permissions"),
  rateLimit: integer("rateLimit").notNull().default(100),
  rateLimitDuration: integer("rateLimitDuration").notNull().default(60000),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type McpApiKeySelect = typeof mcpApiKeys.$inferSelect;
export type McpApiKeyInsert = typeof mcpApiKeys.$inferInsert;