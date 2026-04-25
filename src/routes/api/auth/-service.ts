/**
 * Better Auth service route group.
 * Encapsulates auth engine passthrough and allowed-method enforcement.
 */

import { Elysia } from "elysia";
import type { Context } from "elysia";
import { auth } from "~/lib/auth";
import { AUTH_ALLOWED_METHODS } from "~/config";

/**
 * Auth service handler that delegates to Better Auth.
 * Accepts configured methods and rejects others with 405.
 */
export const authServiceRoutes = new Elysia({ name: "auth.routes.service" }).all(
  "*",
  async (context: Context & { request: Request }) => {
    if (AUTH_ALLOWED_METHODS.includes(context.request.method)) {
      return await auth.handler(context.request);
    }
    context.set.status = 405;
    context.set.headers["Allow"] = AUTH_ALLOWED_METHODS.join(", ");
    return "Method Not Allowed";
  },
  {
    detail: {
      summary: "Auth engine passthrough",
      description:
        "Catch-all route that forwards requests to the Better Auth handler. The concrete paths are defined by Better Auth itself.",
      tags: ["auth"],
      responses: {
        200: { description: "Better Auth response (varies by endpoint)" },
        405: {
          description: "Method not allowed for auth endpoints",
          headers: {
            Allow: {
              description: "Comma-separated list of allowed methods",
              schema: { type: "string" },
            },
          },
        },
      },
    },
  },
);