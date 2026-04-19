/**
 * API index route handler.
 * Handles the base `/api/` route and re-exports core API functionality.
 */

import { createFileRoute } from "@tanstack/react-router";
import { handle } from "./$";

export { createApiRoutes, apiRoutes, getAPI } from "./$";

/**
 * TanStack Start index route definition for /api.
 */
export const Route = createFileRoute("/api/")({
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