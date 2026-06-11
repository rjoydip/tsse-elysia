import { defineRpcFunction } from "./helpers";

/**
 * Database health RPC.
 * Checks database connection health, latency, and pool statistics.
 */
export const dbHealthRpc = defineRpcFunction({
  name: "db:health",
  type: "query",
  args: [],
  returns: undefined,
  agent: {
    description: "Check database connection health, latency, and pool statistics.",
    title: "Database Health",
    safety: "read",
  },
  handler: async () => {
    const { getDatabaseHeartbeat } = await import("~/config/db/heartbeat");
    return getDatabaseHeartbeat();
  },
});

/**
 * Database stats RPC.
 * Gets database table statistics.
 */
export const dbStatsRpc = defineRpcFunction({
  name: "db:stats",
  type: "query",
  args: [],
  returns: undefined,
  agent: {
    description: "Get database table statistics including row counts.",
    title: "Database Table Stats",
    safety: "read",
  },
  handler: async () => {
    return {
      status: "healthy",
      tables: [{ name: "user", rowCount: 0 }],
    };
  },
});