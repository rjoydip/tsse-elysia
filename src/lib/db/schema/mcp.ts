/**
 * MCP schema definitions (mcpApiKeys, serviceHealth).
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./auth";

/**
 * MCP API Keys table - stores API keys for MCP client authentication.
 * Allows external AI agents to access the application via MCP protocol.
 * Keys are hashed before storage for security.
 */
export const mcpApiKeys = sqliteTable("mcp_api_key", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("keyHash").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organizationId"),
  permissions: text("permissions"),
  rateLimit: integer("rateLimit").notNull().default(100),
  rateLimitDuration: integer("rateLimitDuration").notNull().default(60_000),
  lastUsedAt: integer("lastUsedAt", { mode: "timestamp" }),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * Service Health table - stores periodic snapshots of service health.
 * Used for status monitoring and historical health graphs.
 */
export const serviceHealth = sqliteTable("service_health", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceName: text("service_name").notNull(),
  status: text("status", { enum: ["up", "down", "degraded"] }).notNull(),
  latencyMs: integer("latency_ms"),
  error: text("error"),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/**
 * MCP API Key relations - defines many-to-one relationship to users.
 * Each API key belongs to exactly one user.
 */
export const mcpApiKeysRelations = relations(mcpApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [mcpApiKeys.userId],
    references: [users.id],
  }),
}));

/**
 * MCP API Key type for runtime use.
 */
export type McpApiKey = typeof mcpApiKeys.$inferSelect;

/**
 * Service Health type for runtime use.
 */
export type ServiceHealth = typeof serviceHealth.$inferSelect;