import { defineRpcFunction } from "./helpers";

/**
 * Cache health RPC.
 * Checks cache backend health, connection status, and current backend type.
 */
export const cacheHealthRpc = defineRpcFunction({
  name: "cache:health",
  type: "query",
  args: [],
  returns: undefined,
  agent: {
    description: "Check cache backend health, connection status, and current backend type.",
    title: "Cache Health",
    safety: "read",
  },
  handler: async () => {
    const { getStorageStatus } = await import("~/lib/cache/index");
    return getStorageStatus();
  },
});

/**
 * Cache stats RPC.
 * Gets cache backend type and health status.
 */
export const cacheStatsRpc = defineRpcFunction({
  name: "cache:stats",
  type: "query",
  args: [],
  returns: undefined,
  agent: {
    description: "Get cache backend type and health status.",
    title: "Cache Stats",
    safety: "read",
  },
  handler: async () => {
    const { getStorageBackend, getStorageStatus } = await import("~/lib/cache/index");
    const backend = getStorageBackend();
    const status = await getStorageStatus();
    return { backend, healthy: status.connected };
  },
});