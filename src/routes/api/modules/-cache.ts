/**
 * Cache API endpoints plugin.
 * Hosts operational Redis liveness probes for the status dashboard.
 */

import { Elysia } from "elysia";
import { getCacheStatus } from "~/lib/cache";

/**
 * Cache heartbeat response example used for OpenAPI documentation.
 *
 * @remarks
 * The actual payload is produced by `getCacheStatus()`; this example
 * is kept generic to avoid coupling docs to internal implementation details.
 */
const cacheHeartbeatExample = {
  status: "healthy",
  connected: true,
  url: "redis://***@localhost:6379",
  timestamp: new Date(0).toISOString(),
} as const;

/**
 * Cache API route group.
 * Mounted under `/api` by the core API application.
 */
export const cacheRoutes = new Elysia({
  name: "api.routes.cache",
  prefix: "/cache",
}).get(
  "/heartbeat",
  async () => {
    const startTime = performance.now();
    const cacheStatus = await getCacheStatus();
    const latencyMs = Math.round(performance.now() - startTime);
    const statusCode = cacheStatus.connected ? 200 : 503;

    return new Response(
      JSON.stringify({
        status: cacheStatus.connected ? "healthy" : "unhealthy",
        connected: cacheStatus.connected,
        url: cacheStatus.url,
        detail: cacheStatus.error ?? "Cache heartbeat succeeded",
        timestamp: new Date().toISOString(),
        backend: cacheStatus.backend,
        latencyMs,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
  {
    detail: {
      summary: "Cache heartbeat",
      description:
        "Lightweight liveness probe for the Cache layer. Returns `200` when connected and `503` when unreachable.",
      tags: ["api", "cache", "health"],
      responses: {
        200: {
          description: "Cache is reachable and operating normally",
          content: { "application/json": { example: cacheHeartbeatExample } },
        },
        503: {
          description: "Cache is unhealthy or unreachable",
          content: {
            "application/json": {
              example: {
                ...cacheHeartbeatExample,
                status: "unhealthy",
                connected: false,
              },
            },
          },
        },
      },
    },
  },
);