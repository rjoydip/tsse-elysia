/**
 * Status API endpoints plugin.
 * Provides historical health and status data for the dashboard.
 */

import { Elysia, t } from "elysia";
import { db, schema } from "~/lib/db";
import { desc, gt } from "drizzle-orm";

/**
 * Historical status response schema for OpenAPI.
 */
const statusHistoryExample = [
  {
    serviceName: "Core API",
    status: "up",
    latencyMs: 15,
    timestamp: new Date().toISOString(),
  },
];

/**
 * Status API route group.
 * Mounted under `/api/status`.
 */
export const statusRoutes = new Elysia({ name: "api.routes.status", prefix: "/status" }).get(
  "/history",
  async ({ query }) => {
    const hours = Number(query.hours || 24);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Fetch health records from the specified period
    const records = await db
      .select()
      .from(schema.serviceHealth)
      .where(gt(schema.serviceHealth.timestamp, cutoff))
      .orderBy(desc(schema.serviceHealth.timestamp));

    return records;
  },
  {
    query: t.Object({
      hours: t.Optional(t.String()),
    }),
    detail: {
      summary: "Get status history",
      description:
        "Returns historical health check records for all services within a given time window (default 24h).",
      tags: ["api", "status"],
      responses: {
        200: {
          description: "List of historical health records",
          content: { "application/json": { example: statusHistoryExample } },
        },
      },
    },
  },
);