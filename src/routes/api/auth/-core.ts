/**
 * Auth core informational endpoints.
 * Provides root and health responses for auth service monitoring.
 */

import { Elysia } from "elysia";
import { AUTH_SERVICE_NAME } from "~/config";
import { authServiceRoutes } from "./-service";

/**
 * Auth health response example for OpenAPI.
 */
const authHealthResponseExample = {
  name: AUTH_SERVICE_NAME,
  status: "healthy",
  timestamp: new Date(0).toISOString(),
} as const;

/**
 * Core auth route group mounted under `/api/auth`.
 */
export const authCoreRoutes = new Elysia({ name: "auth.routes.core", prefix: "/auth" })
  .use(authServiceRoutes)
  .get(
    "/",
    ({ set }) => {
      set.headers["Content-Type"] = "text/plain; charset=utf-8";
      return `Welcome to ${AUTH_SERVICE_NAME} Service`;
    },
    {
      detail: {
        summary: `${AUTH_SERVICE_NAME} root`,
        description:
          "Plain-text service identity endpoint. Useful for smoke checks and verifying the auth service is mounted.",
        tags: ["auth"],
        responses: {
          200: { description: "Plain-text welcome message" },
        },
      },
    },
  )
  .get(
    "/health",
    async () =>
      new Response(
        JSON.stringify({
          name: AUTH_SERVICE_NAME,
          status: "healthy",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    {
      detail: {
        summary: "Auth health check",
        description:
          "Health probe for the auth subsystem. Returns the auth service name, a static `healthy` status, and a server timestamp.",
        tags: ["auth", "health"],
        responses: {
          200: {
            description: "Health check payload",
            content: { "application/json": { example: authHealthResponseExample } },
          },
        },
      },
    },
  );