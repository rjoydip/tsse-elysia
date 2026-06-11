/**
 * TSSE Elysia DevKit — developer administration toolkit.
 * Provides DB health, cache stats, system info, and more via CLI and MCP.
 *
 * Usage:
 *   bun run devkit              Run devkit CLI (interactive)
 *   bun run devkit db:health    Check database health
 *   bun run devkit cache:health Check cache health
 *   bun run devkit system:info  Get system information
 *   bun run devkit:mcp          Start MCP server for AI agent use
 */

export { dbHealthRpc, dbStatsRpc } from "./rpc/db";
export { cacheHealthRpc, cacheStatsRpc } from "./rpc/cache";
export { systemInfoRpc } from "./rpc/system";

import { dbHealthRpc, dbStatsRpc } from "./rpc/db";
import { cacheHealthRpc, cacheStatsRpc } from "./rpc/cache";
import { systemInfoRpc } from "./rpc/system";

/**
 * Map of all available RPCs by name.
 */
export const rpcMap = {
  "db:health": dbHealthRpc,
  "db:stats": dbStatsRpc,
  "cache:health": cacheHealthRpc,
  "cache:stats": cacheStatsRpc,
  "system:info": systemInfoRpc,
} as const;

/**
 * List of all RPC names for CLI help display.
 */
export const rpcNames = Object.keys(rpcMap) as Array<keyof typeof rpcMap>;

/**
 * Type for RPC handler result.
 */
export type RpcResult = Record<string, unknown>;