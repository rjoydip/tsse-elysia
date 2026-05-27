/**
 * Server-only API application module.
 * Extracted from $.ts to prevent Elysia + pg from being bundled into the client route tree.
 * Only imported dynamically by $.ts at runtime on the server.
 */

import { Elysia } from "elysia";
import { treaty } from "@elysiajs/eden";
import { API_PREFIX, APP_NAME, HOST, PORT, isBrowser } from "~/config";
import { composedMiddleware, errorFn, traceFn } from "~/middlewares";
import { websocketPlugin } from "~/plugins/websocket";
import { evlogPlugin, evlogIngestEndpoint } from "~/plugins/evlog-plugin";
import { monitoringPlugin } from "~/plugins/monitoring";
import { coreRoutes } from "./root/-core";
import { mcpCoreRoutes } from "./mcp/-core";
import { authCoreRoutes } from "./auth/-core";
import { settingsRoutes } from "./settings/-core";
import { usersRoutes } from "./users/-core";
import { rolesRoutes } from "./roles/-core";
import {
  metricsRoutes,
  analyticsRoutes,
  recentActivityRoutes,
  overviewChartRoutes,
} from "./dashboard/-core";

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
    .use(usersRoutes)
    .use(rolesRoutes)
    .use(metricsRoutes)
    .use(analyticsRoutes)
    .use(recentActivityRoutes)
    .use(overviewChartRoutes)
    // Evlog client ingestion endpoint for browser logs
    .use(evlogIngestEndpoint());

/**
 * HMR-safe singleton key for API routes persistence across Vite module re-evaluation.
 */
const API_ROUTES_KEY = "___tsse_elysia_api_routes";

/**
 * Main API application instance (singleton).
 * Prefix: /api (configurable via API_PREFIX)
 * Includes all security middleware, tracing, and error handling.
 * Includes WebSocket endpoint registration for real-time features.
 *
 * Persisted on `globalThis` to survive Vite HMR module re-evaluation.
 * Without this guard, every HMR cycle creates a new Elysia app, which causes
 * @elysiajs/cron to register additional cron jobs — the old ones are never
 * stopped, leading to duplicate health check executions.
 */
const _globalStore = globalThis as Record<string, unknown>;

// Guard: create the app instance only once per process. Subsequent HMR
// re-evaluations reuse the existing instance so that @elysiajs/cron does
// not register duplicate cron jobs.
if (!(API_ROUTES_KEY in _globalStore)) {
  _globalStore[API_ROUTES_KEY] = createApiRoutes();
}

export const apiRoutes = _globalStore[API_ROUTES_KEY] as ReturnType<typeof createApiRoutes>;

/**
 * Request handler wrapper for TanStack Start integration.
 * Adapts Elysia handler to TanStack Start's server handler interface.
 * Wraps in try-catch to catch any unhandled Elysia errors (e.g., HTTPError
 * during response serialization) and return a proper JSON error response.
 */
export const handle = async ({ request }: { request: Request }): Promise<Response> => {
  try {
    return await apiRoutes.fetch(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
};

/**
 * Isomorphic API client for type-safe API calls.
 * Works both on server (SSR) and client (browser) with proper typing.
 * Uses Eden Treaty for end-to-end type safety.
 */
export const getAPI = () => {
  // Server: Use in-process Elysia handler (no HTTP overhead)
  if (typeof window === "undefined") {
    return treaty(apiRoutes).api;
  }
  // Client: Make HTTP requests to server
  const url =
    import.meta.env.VITE_API_URL || (isBrowser ? window.location.origin : `http://${HOST}:${PORT}`);
  return treaty<typeof apiRoutes>(url).api;
};