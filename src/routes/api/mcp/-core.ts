/**
 * MCP core API endpoints.
 * Health checks, tool discovery, delegates business logic to services.
 */

import { Elysia } from "elysia";
import { getMcpServer } from "~/lib/mcp/server";
import { sessionManager } from "~/lib/mcp/transport";
import { mcpKeysRoutes } from "./-keys";
import { getHealthRateLimitResponse } from "~/services/mcp";
import { getLiveToolCatalogFromServer } from "~/services/mcp";

const mcpHealthExample = {
  status: "healthy",
  activeConnections: 0,
  timestamp: new Date(0).toISOString(),
} as const;

const mcpToolsExample = {
  tools: [
    {
      name: "auth.login",
      title: "Login",
      description: "Authenticate a user",
      category: "auth",
    },
  ],
} as const;

export const mcpCoreRoutes = new Elysia({ name: "mcp.routes.core", prefix: "/mcp" })
  .use(mcpKeysRoutes)
  .get(
    "/",
    ({ set }) => {
      set.headers["Content-Type"] = "text/plain; charset=utf-8";
      return `Welcome to MCP Service`;
    },
    {
      detail: {
        summary: "MCP root",
        description:
          "Plain-text service identity endpoint for the MCP subsystem. Useful for smoke checks and verifying mount points.",
        tags: ["mcp"],
        responses: {
          200: { description: "Plain-text welcome message" },
        },
      },
    },
  )
  .get(
    "/health",
    async ({ request }) => {
      const throttled = getHealthRateLimitResponse(request);
      if (throttled) {
        return throttled;
      }

      getMcpServer();
      const activeConnections = sessionManager.getActiveCount();

      return new Response(
        JSON.stringify({
          status: "healthy",
          activeConnections,
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    },
    {
      detail: {
        tags: ["mcp", "health"],
        summary: "MCP health check",
        description:
          "Health probe for MCP server readiness. Includes active transport session count. Rate-limited to mitigate probing abuse.",
        responses: {
          200: {
            description: "MCP is healthy",
            content: { "application/json": { example: mcpHealthExample } },
          },
          429: {
            description: "Rate limit exceeded for health probes",
          },
        },
      },
    },
  )
  .get(
    "/tools",
    async () => {
      const server = getMcpServer();
      const tools = getLiveToolCatalogFromServer(server);
      return Response.json({ tools });
    },
    {
      detail: {
        tags: ["mcp"],
        summary: "List MCP tools",
        description:
          "Returns the live tool catalog registered on the MCP server. Intended for UI discovery and debugging.",
        responses: {
          200: {
            description: "Tool catalog",
            content: { "application/json": { example: mcpToolsExample } },
          },
        },
      },
    },
  );