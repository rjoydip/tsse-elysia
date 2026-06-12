/**
 * MCP schema — proxy re-exporting generated SQLite tables with relations.
 * Tables are generated from portable DSL definitions.
 */

import { relations } from "drizzle-orm";

import { users } from "./sqlite/users";
import { mcpApiKeys } from "./sqlite/mcpApiKeys";
import { serviceHealth } from "./sqlite/serviceHealth";

export { mcpApiKeys, serviceHealth };

export const mcpApiKeysRelations = relations(mcpApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [mcpApiKeys.userId],
    references: [users.id],
  }),
}));

export type McpApiKey = typeof mcpApiKeys.$inferSelect;
export type ServiceHealth = typeof serviceHealth.$inferSelect;