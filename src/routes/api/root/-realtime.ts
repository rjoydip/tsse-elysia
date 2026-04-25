/**
 * Realtime API endpoints plugin.
 * Groups websocket discovery and health endpoints under `/api/realtime*`.
 */

import { Elysia } from "elysia";
import { API_PREFIX } from "~/config";
import { connectionStore } from "~/lib/realtime";

/**
 * Realtime discovery payload example for OpenAPI.
 *
 * @remarks
 * This endpoint is used by clients to learn websocket paths at runtime.
 */
const realtimeDiscoveryExample = {
  websocketEndpoint: `${API_PREFIX}/ws`,
  healthEndpoint: `${API_PREFIX}/realtime/health`,
  requiresAuth: true,
} as const;

/**
 * Realtime health payload example for OpenAPI.
 */
const realtimeHealthExample = {
  status: "healthy",
  websocketPath: `${API_PREFIX}/ws`,
  totalConnections: 0,
  authenticatedConnections: 0,
  timestamp: new Date(0).toISOString(),
} as const;

/**
 * Realtime API route group.
 * Mounted under `/api` by the root API application.
 */
export const realtimeRoutes = new Elysia({ name: "api.routes.realtime", prefix: "/realtime" })
  .get(
    "/",
    () =>
      new Response(
        JSON.stringify({
          websocketEndpoint: `${API_PREFIX}/ws`,
          healthEndpoint: `${API_PREFIX}/realtime/health`,
          requiresAuth: true,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    {
      detail: {
        summary: "Realtime endpoint discovery",
        description:
          "Returns websocket and health endpoint paths that realtime clients can use to connect and monitor readiness.",
        tags: ["api", "realtime"],
        responses: {
          200: {
            description: "Realtime endpoint metadata",
            content: { "application/json": { example: realtimeDiscoveryExample } },
          },
        },
      },
    },
  )
  .get(
    "/health",
    () =>
      new Response(
        JSON.stringify({
          status: "healthy",
          websocketPath: `${API_PREFIX}/ws`,
          totalConnections: connectionStore.getCount(),
          authenticatedConnections: connectionStore.getAuthenticatedCount(),
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    {
      detail: {
        summary: "Realtime health check",
        description:
          "Readiness probe for websocket infrastructure. Includes connection counters for operational monitoring.",
        tags: ["api", "realtime", "health"],
        responses: {
          200: {
            description: "Realtime readiness and connection stats",
            content: { "application/json": { example: realtimeHealthExample } },
          },
        },
      },
    },
  );