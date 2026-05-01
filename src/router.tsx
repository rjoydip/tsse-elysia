/**
 * Application Router Configuration
 * Sets up TanStack Router with error handling and authentication.
 */

import { createRouter } from "@tanstack/react-router";
import { initLog } from "evlog/client";
import { routeTree } from "~/routeTree.gen";
import { logger } from "~/lib/logger";

initLog({
  service: "app",
  transport: {
    enabled: import.meta.env.PROD,
    endpoint: "/api/_evlog/ingest", // default endpoint
  },
});
logger.info("Application started");

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function getRouter() {
  return router;
}