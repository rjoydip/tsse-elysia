/**
 * Core API endpoints plugin.
 * Encapsulates base `/api` informational and health routes.
 */

import { Elysia } from "elysia";
import { readFileSync } from "node:fs";
import { APP_NAME } from "~/config";
import { realtimeRoutes } from "./-realtime";
import { databaseRoutes } from "./-database";
import { cacheRoutes } from "./-cache";
import { llmoRoutes } from "./-llmo";
import { statusRoutes } from "./-status";

/**
 * Read package.json to extract metadata (name, version).
 * Uses `import.meta.url` to resolve path relative to this file.
 */
const pkg = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8")) as {
  name: string;
  version: string;
};

/**
 * OpenAPI response schema for the API health endpoint.
 *
 * @remarks
 * - Elysia OpenAPI uses runtime schemas primarily from `elysia/t`.
 * - This route returns a JSON payload via `Response`, so we document the shape explicitly.
 */
const apiHealthResponseExample = {
  name: APP_NAME,
  status: "healthy",
  timestamp: new Date(0).toISOString(),
} as const;

/**
 * Core API route group.
 * Mounted under `/api` by the root API application.
 */
export const coreRoutes = new Elysia({ name: "api.routes.core" })
  .use(realtimeRoutes)
  .use(databaseRoutes)
  .use(cacheRoutes)
  .use(llmoRoutes)
  .use(statusRoutes)
  .get(
    "/",
    ({ set }) => {
      set.headers["Content-Type"] = "text/plain; charset=utf-8";
      return `Welcome to ${APP_NAME} Service`;
    },
    {
      detail: {
        summary: "API root",
        description:
          "Returns a plain-text welcome message. Useful for smoke checks and quick environment verification.",
        tags: ["api"],
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
          name: APP_NAME,
          status: "healthy",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    {
      detail: {
        summary: "API health check",
        description:
          "Health probe for uptime checks. Returns the service name, a static `healthy` status, and a server timestamp.",
        tags: ["api", "health"],
        responses: {
          200: {
            description: "Health check payload",
            content: {
              "application/json": {
                example: apiHealthResponseExample,
              },
            },
          },
        },
      },
    },
  )
  .get(
    "/meta",
    () =>
      new Response(JSON.stringify({ name: pkg.name, version: pkg.version }), {
        headers: { "Content-Type": "application/json" },
      }),
    {
      detail: {
        summary: "API metadata",
        description: "Returns application metadata including name and version from package.json.",
        tags: ["api"],
        responses: {
          200: {
            description: "Metadata payload with name and version",
            content: {
              "application/json": {
                example: { name: "tsse-elysia", version: "0.1.0" },
              },
            },
          },
        },
      },
    },
  );