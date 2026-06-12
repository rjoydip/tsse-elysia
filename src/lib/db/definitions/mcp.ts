/**
 * DSL definitions for MCP tables (mcpApiKey, serviceHealth).
 * Single source of truth for MCP schema.
 */

import { defineTable, uid, text, integer, timestamp } from "./builder";

/**
 * MCP API Keys table - stores API keys for MCP client authentication.
 */
export const mcpApiKey = defineTable("mcpApiKeys", "mcp_api_key", {
  id: uid(),
  name: { ...text(), notNull: true },
  keyHash: { ...text(), notNull: true, unique: true },
  userId: {
    ...text(),
    notNull: true,
    references: { table: "users", column: "id", onDelete: "cascade" },
  },
  organizationId: text(),
  permissions: text(),
  rateLimit: { ...integer(), notNull: true, defaultValue: 100 },
  rateLimitDuration: { ...integer(), notNull: true, defaultValue: 60_000 },
  lastUsedAt: timestamp(),
  expiresAt: timestamp(),
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});

/**
 * Service Health table - stores periodic snapshots of service health.
 */
export const serviceHealth = defineTable("serviceHealth", "service_health", {
  id: { ...integer(), primaryKey: true, autoIncrement: true },
  serviceName: { ...text(), notNull: true, dbName: "service_name" },
  status: {
    ...text(),
    notNull: true,
    dbName: "status",
    // enum handled via enum constraint in SQLite, pgEnum in PG
  },
  latencyMs: { ...integer(), dbName: "latency_ms" },
  error: text(),
  timestamp: { ...timestamp(), notNull: true },
});