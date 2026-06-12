/**
 * Auto-generated SQLite schema for "mcp_api_key" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const mcpApiKeys = sqliteTable("mcp_api_key", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("keyHash").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: "cascade" }),
  organizationId: text("organizationId"),
  permissions: text("permissions"),
  rateLimit: integer("rateLimit").notNull().default(100),
  rateLimitDuration: integer("rateLimitDuration").notNull().default(60000),
  lastUsedAt: integer("lastUsedAt", { mode: "timestamp" }),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type McpApiKeySelect = typeof mcpApiKeys.$inferSelect;
export type McpApiKeyInsert = typeof mcpApiKeys.$inferInsert;