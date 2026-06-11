/**
 * Shared controller utilities for session validation and auth.
 * Consolidates duplicate validateSession logic across controllers.
 */

import { auth } from "~/lib/auth";
import type { Context } from "elysia";

/**
 * Session data returned after validation.
 */
export interface SessionData {
  userId: string;
  email: string;
}

/**
 * Validates the session from the request.
 * Returns an error response if not authenticated, otherwise returns session data.
 * Supports TEST_AUTH_BYPASS for integration testing.
 */
export async function validateSession(
  request: Request,
  set: Context["set"],
): Promise<{ error?: Response; session?: SessionData }> {
  if (process.env.TEST_AUTH_BYPASS === "true") {
    return { session: { userId: "test-user-id", email: "test@example.com" } };
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    set.status = 401;
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return {
    session: {
      userId: session.user.id,
      email: session.user.email,
    },
  };
}