/**
 * Main API route handler (Splat Route).
 * Catches all requests under `/api/*` and delegates to Elysia.
 * Server-only code is dynamically imported to prevent bundling Elysia + pg into the client.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { treaty } from "@elysiajs/eden";
import { isBrowser, HOST, PORT } from "~/config";
import type { apiRoutes } from "./-app";

/**
 * Dynamically imports the Elysia handler from the server-only module.
 * This prevents Elysia (and its transitive deps like pg) from being bundled into the client.
 */
const getHandler = async ({ request }: { request: Request }) => {
  const { handle } = await import("./-app");
  // Clone the request to preserve the body before passing downstream.
  // TanStack Start may consume the body stream during H3Event setup,
  // causing request.json() / request.text() to fail in route handlers.
  return handle({ request: request.clone() });
};

/**
 * TanStack Start splat route definition.
 * Catches all requests starting with `/api` and delegates to Elysia.
 */
export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: getHandler,
      POST: getHandler,
      PUT: getHandler,
      PATCH: getHandler,
      DELETE: getHandler,
      OPTIONS: getHandler,
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
  .server(async () => {
    const { treaty: serverTreaty } = await import("@elysiajs/eden");
    const { apiRoutes } = await import("./-app");
    return serverTreaty(apiRoutes).api;
  })
  // Client: Make HTTP requests to server
  .client(() => {
    const url =
      import.meta.env.VITE_API_URL ||
      (isBrowser ? window.location.origin : `http://${HOST}:${PORT}`);
    return treaty<typeof apiRoutes>(url).api;
  });