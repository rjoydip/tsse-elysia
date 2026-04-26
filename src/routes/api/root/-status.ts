/**
 * Status API endpoints plugin.
 * Delegates historical health data fetching to the status service.
 */

import { Elysia, t } from "elysia";
import { getStatusHistory } from "~/services/status";

const statusHistoryExample = [
  {
    serviceName: "Core API",
    status: "up",
    latencyMs: 15,
    timestamp: new Date().toISOString(),
  },
];

export const statusRoutes = new Elysia({ name: "api.routes.status", prefix: "/status" }).get(
  "/history",
  async ({ query }) => {
    const hours = Number(query.hours || 24);
    const records = await getStatusHistory({ hours });
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