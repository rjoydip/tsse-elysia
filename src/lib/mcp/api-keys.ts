/**
 * @deprecated Use `~/services/mcp/api-keys.service` and `~/repositories/mcp/api-keys.repository` instead.
 * Re-exports for backward compatibility.
 */

import { mcpApiKeyService } from "~/services/mcp/api-keys";

// Re-export service and repository types
export { type IMcpApiKeyService } from "~/services/mcp/api-keys";
export { type IMcpApiKeyRepository } from "~/repositories/mcp/api-keys.repository";

// Re-export service instance as legacy name
export const mcpApiKeyServiceLegacy = mcpApiKeyService;

// Re-export commonly used functions for minimal backward compatibility
export const generateApiKey = () => mcpApiKeyService.generateApiKey();
export const hashKey = (key: string) => mcpApiKeyService.hashKey(key);
export const validateApiKey = (key: string) => mcpApiKeyService.validateApiKey(key);
export const createApiKey = (opts: Parameters<typeof mcpApiKeyService.createApiKey>[0]) =>
  mcpApiKeyService.createApiKey(opts);
export const revokeApiKey = (id: string, userId: string) =>
  mcpApiKeyService.revokeApiKey(id, userId);
export const revokeApiKeyWithReason = (id: string, userId: string) =>
  mcpApiKeyService.revokeApiKeyWithReason(id, userId);
export const listApiKeys = (userId: string) => mcpApiKeyService.listApiKeys(userId);
export const getApiKeyById = (id: string, userId: string) =>
  mcpApiKeyService.getApiKeyById(id, userId);
export const updateApiKey = (
  id: string,
  userId: string,
  updates: Parameters<typeof mcpApiKeyService.updateApiKey>[2],
) => mcpApiKeyService.updateApiKey(id, userId, updates);