/**
 * Database API endpoints plugin.
 * Hosts operational database liveness probes.
 */

import { Elysia } from "elysia";
import { getDatabaseHeartbeat } from "~/lib/db/heartbeat";

/**
 * Database heartbeat response example used for OpenAPI documentation.
 *
 * @remarks
 * The actual payload is produced by `getDatabaseHeartbeat()`; this example is kept generic
 * to avoid coupling docs to internal implementation details.
 */
const databaseHeartbeatExample = {
  status: "healthy",
  timestamp: new Date(0).toISOString(),
} as const;

/**
 * Database API route group.
 * Mounted under `/api` by the root API application.
 */
export const databaseRoutes = new Elysia({ name: "api.routes.database", prefix: "/database" }).get(
  "/heartbeat",
  async () => {
    const heartbeat = await getDatabaseHeartbeat();
    const statusCode = heartbeat.status === "healthy" ? 200 : 503;

    return new Response(JSON.stringify(heartbeat), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  },
  {
    detail: {
      summary: "Database heartbeat",
      description:
        "Lightweight liveness probe for the database layer. Returns `200` when healthy and `503` when unhealthy.",
      tags: ["api", "database", "health"],
      responses: {
        200: {
          description: "Database is reachable and operating normally",
          content: { "application/json": { example: databaseHeartbeatExample } },
        },
        503: {
          description: "Database is unhealthy or unreachable",
          content: {
            "application/json": { example: { ...databaseHeartbeatExample, status: "unhealthy" } },
          },
        },
      },
    },
  },
);