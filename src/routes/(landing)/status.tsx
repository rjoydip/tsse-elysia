/**
 * Status Page
 * Optimized with JSON-LD structured data for LLMO.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/llmo
 */

import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "~/config";
import { HealthDashboard } from "~/features/landing/status";

export const Route = createFileRoute("/(landing)/status")({
  component: HealthDashboard,
  head: () => ({
    meta: [
      {
        name: "description",
        content: `Status dashboard for ${APP_NAME} - Health checks for API, database, realtime, and Redis services`,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${APP_NAME} Status`,
          description: `Health and status dashboard for ${APP_NAME}`,
          isPartOf: {
            "@type": "WebSite",
            name: APP_NAME,
            url: "https://github.com/rjoydip/tsse-elysia",
          },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: [
              { name: "API Health", url: "/api/health" },
              { name: "Database Health", url: "/api/database" },
              { name: "Redis Health", url: "/api/cache" },
              { name: "Realtime Health", url: "/api/realtime/health" },
              { name: "MCP Health", url: "/api/mcp/health" },
              { name: "Auth Health", url: "/api/auth/health" },
            ],
          },
        }),
      },
    ],
  }),
});