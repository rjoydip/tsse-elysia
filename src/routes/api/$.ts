/**
 * Main API route handler (Splat Route).
 * Handles all requests under `/api/*` and routes them to the Elysia application.
 * Sets up the core API application with middleware and routes.
 */

import { Elysia } from "elysia";
import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { API_PREFIX, APP_NAME, HOST, PORT, isBrowser } from "~/config";
import { composedMiddleware, errorFn, traceFn } from "~/middlewares";
import { websocketPlugin } from "~/plugins/websocket";
import { evlogPlugin, evlogIngestEndpoint } from "~/plugins/evlog-plugin";
import { monitoringPlugin } from "~/plugins/monitoring";
import { coreRoutes } from "./root/-core";
import { mcpCoreRoutes } from "./mcp/-core";
import { authCoreRoutes } from "./auth/-core";
import { settingsRoutes } from "./settings/-core";
import { treaty } from "@elysiajs/eden";

/**
 * Main API application instance factory.
 * Allows creating isolated instances for testing to avoid shared state race conditions.
 */
export const createApiRoutes = () =>
  new Elysia({
    name: "root.api",
    prefix: API_PREFIX,
  })
    // Disable caching for all API responses to ensure fresh data
    .onRequest(({ set }) => {
      set.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
      set.headers["Pragma"] = "no-cache";
      set.headers["Expires"] = "0";
      set.headers["Surrogate-Control"] = "no-store";
    })
    // Apply composed middleware (CORS, Helmet, Rate Limit, OpenTelemetry)
    .use(
      composedMiddleware({
        OPENAPI_NAME: APP_NAME,
      }),
    )
    // Custom evlog plugin for request/response logging
    .use(
      evlogPlugin({
        logRequests: true,
        logTiming: true,
        logErrors: true,
        excludePaths: ["/_evlog"],
      }),
    )
    // Request tracing for performance monitoring
    .trace(traceFn)
    // Custom error handler for JSON error responses
    .onError(errorFn)
    /**
     * Compose modular route groups so endpoint ownership is explicit and maintainable.
     */
    // Mount realtime websocket plugin so /api/ws and /api/ws/health are reachable.
    .use(websocketPlugin)
    .use(monitoringPlugin)
    .use(coreRoutes)
    .use(authCoreRoutes)
    .use(mcpCoreRoutes)
    .use(settingsRoutes)
    // Evlog client ingestion endpoint for browser logs
    .use(evlogIngestEndpoint());

/**
 * Main API application instance (singleton).
 * Prefix: /api (configurable via API_PREFIX)
 * Includes all security middleware, tracing, and error handling.
 * Includes WebSocket endpoint registration for real-time features.
 */
export const apiRoutes = createApiRoutes();

/**
 * Request handler wrapper for TanStack Start integration.
 * Adapts Elysia handler to TanStack Start's server handler interface.
 */
// fallow-ignore-next-line
export const handle = ({ request }: { request: Request }) => apiRoutes.fetch(request);

/**
 * TanStack Start splat route definition.
 * Catches all requests starting with `/api` and delegates to Elysia.
 */
export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
      OPTIONS: handle,
    },
  },
});

/**
 * Isomorphic API client for type-safe API calls.
 * Works both on server (SSR) and client (browser) with proper typing.
 * Uses Eden Treaty for end-to-end type safety.
 *
 * @example
 * // Server-side (SSR):
 * const api = getAPI()
 * const result = await api.health.get()
 *
 * // Client-side:
 * const api = getAPI()
 * const result = await api.health.get()
 */
// fallow-ignore-next-line
export const getAPI = createIsomorphicFn()
  // Server: Use in-process Elysia handler (no HTTP overhead)
  .server(() => treaty(apiRoutes).api)
  // Client: Make HTTP requests to server
  .client(() => {
    const url =
      import.meta.env.VITE_API_URL ||
      (isBrowser ? window.location.origin : `http://${HOST}:${PORT}`);
    return treaty<typeof apiRoutes>(url).api;
  });