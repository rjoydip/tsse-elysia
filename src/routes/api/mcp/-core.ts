import { Elysia } from "elysia";

import { getMcpServer } from "~/lib/mcp/server";
import { sessionManager } from "~/lib/mcp/transport";
import { mcpKeysRoutes } from "./-keys";

/**
 * Maximum unauthenticated health checks allowed per requester in one time window.
 */
const HEALTH_RATE_LIMIT = 60;

/**
 * Duration of the health endpoint rate-limit window in milliseconds.
 */
const HEALTH_RATE_LIMIT_WINDOW_MS = 60_000;

type RegisteredToolInfo = {
  title?: string;
  description?: string;
};

/**
 * MCP health response example for OpenAPI.
 */
const mcpHealthExample = {
  status: "healthy",
  activeConnections: 0,
  timestamp: new Date(0).toISOString(),
} as const;

/**
 * MCP tools discovery response example for OpenAPI.
 */
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

/**
 * In-memory health endpoint limiter keyed by requester identity.
 * This mitigates probing abuse without requiring authenticated API keys.
 */
const healthRequestTracker = new Map<string, { count: number; resetAt: number }>();

/**
 * Resolves a best-effort requester key for health endpoint throttling.
 *
 * @param request - Incoming HTTP request
 * @returns Stable key for per-client throttling windows
 */
function getHealthRequesterKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown";
}

/**
 * Applies fixed-window throttling to MCP health probes.
 *
 * @param request - Incoming request
 * @returns A 429 response when throttled, otherwise null
 */
function getHealthRateLimitResponse(request: Request): Response | null {
  const now = Date.now();
  const requesterKey = getHealthRequesterKey(request);
  const existing = healthRequestTracker.get(requesterKey);

  /**
   * Opportunistic cleanup to avoid unbounded memory usage in long-lived processes.
   * This is intentionally lightweight (no timers) since health checks are periodic.
   */
  for (const [key, record] of healthRequestTracker.entries()) {
    if (now > record.resetAt) {
      healthRequestTracker.delete(key);
    }
  }

  if (!existing || now > existing.resetAt) {
    healthRequestTracker.set(requesterKey, {
      count: 1,
      resetAt: now + HEALTH_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (existing.count >= HEALTH_RATE_LIMIT) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        limit: HEALTH_RATE_LIMIT,
        resetAt: new Date(existing.resetAt).toISOString(),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((existing.resetAt - now) / 1000)),
          "X-RateLimit-Limit": String(HEALTH_RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(existing.resetAt / 1000)),
        },
      },
    );
  }

  existing.count += 1;
  return null;
}

/**
 * Converts the MCP server's live tool registry to the `/tools` HTTP response shape.
 *
 * @returns Tool metadata currently registered on the MCP server
 */
function getLiveToolCatalogFromServer(): Array<{
  name: string;
  title: string;
  description: string;
  category: "auth" | "users" | "organization";
}> {
  const server = getMcpServer() as unknown as {
    _registeredTools?: Record<string, RegisteredToolInfo>;
  };
  const registeredTools = server._registeredTools ?? {};

  /**
   * Infers tool category from naming conventions used by MCP tool modules.
   */
  const resolveCategory = (toolName: string): "auth" | "users" | "organization" => {
    if (toolName.includes("organization") || toolName.includes("member")) {
      return "organization";
    }
    if (toolName.includes("user")) {
      return "users";
    }
    return "auth";
  };

  return Object.entries(registeredTools).map(([name, metadata]) => ({
    name,
    title: metadata.title ?? name,
    description: metadata.description ?? "",
    category: resolveCategory(name),
  }));
}

/**
 * Core mcp route group mounted under `/api/mcp`.
 */
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
    async () =>
      new Response(JSON.stringify({ tools: getLiveToolCatalogFromServer() }), {
        headers: { "Content-Type": "application/json" },
      }),
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