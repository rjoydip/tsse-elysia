#!/usr/bin/env bun
/**
 * TSSE Elysia DevKit MCP Server.
 * Exposes developer tools (DB health, cache stats, system info) to MCP clients.
 * Uses the existing @modelcontextprotocol/sdk for MCP server implementation.
 *
 * Usage:
 *   bun run devkit:mcp
 *
 * Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "tsse-elysia-devkit": {
 *         "command": "bun",
 *         "args": ["run", "devkit:mcp"]
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { rpcMap } from "./index";

/**
 * Creates the Devkit MCP server with all developer tools.
 */
function createDevkitMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "tsse-elysia-devkit",
      version: "1.0.0",
    },
    {
      instructions:
        "Developer administration tools for TSSE Elysia. " +
        "Provides database health checks, cache status, and system information. " +
        "All tools are read-only and safe to call.",
      capabilities: {
        tools: {},
      },
    },
  );

  // Register DB health tool
  server.registerTool(
    "db:health",
    {
      title: "Database Health",
      description:
        "Check database connection health, latency, and pool statistics. " +
        "Returns status, latency in ms, timestamp, and per-pool health details.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const handler = (
          rpcMap["db:health"] as unknown as { handler?: () => Promise<Record<string, unknown>> }
        ).handler;
        if (!handler) throw new Error("No handler registered");
        const result = await handler();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
              }),
            },
          ],
        };
      }
    },
  );

  // Register DB stats tool
  server.registerTool(
    "db:stats",
    {
      title: "Database Table Stats",
      description: "Get database table statistics including row counts for each table.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const handler = (
          rpcMap["db:stats"] as unknown as { handler?: () => Promise<Record<string, unknown>> }
        ).handler;
        if (!handler) throw new Error("No handler registered");
        const result = await handler();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
              }),
            },
          ],
        };
      }
    },
  );

  // Register Cache health tool
  server.registerTool(
    "cache:health",
    {
      title: "Cache Health",
      description:
        "Check cache backend health, connection status, and current backend type. " +
        "Returns connection status, backend type (redis/lru/postgres), and any error details.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const handler = (
          rpcMap["cache:health"] as unknown as { handler?: () => Promise<Record<string, unknown>> }
        ).handler;
        if (!handler) throw new Error("No handler registered");
        const result = await handler();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
              }),
            },
          ],
        };
      }
    },
  );

  // Register Cache stats tool
  server.registerTool(
    "cache:stats",
    {
      title: "Cache Stats",
      description: "Get cache backend type and health status.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const handler = (
          rpcMap["cache:stats"] as unknown as { handler?: () => Promise<Record<string, unknown>> }
        ).handler;
        if (!handler) throw new Error("No handler registered");
        const result = await handler();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
              }),
            },
          ],
        };
      }
    },
  );

  // Register System info tool
  server.registerTool(
    "system:info",
    {
      title: "System Info",
      description:
        "Get system information including app name, version, runtime, uptime, and environment details.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const handler = (
          rpcMap["system:info"] as unknown as { handler?: () => Promise<Record<string, unknown>> }
        ).handler;
        if (!handler) throw new Error("No handler registered");
        const result = await handler();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
              }),
            },
          ],
        };
      }
    },
  );

  return server;
}

/**
 * Starts the MCP server on stdio transport.
 */
async function main(): Promise<void> {
  const server = createDevkitMcpServer();
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
}

await main().catch((error) => {
  console.error("Devkit MCP server error:", error);
  process.exit(1);
});