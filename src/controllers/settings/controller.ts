/**
 * Settings controller.
 * Handles HTTP-specific logic: session validation, request parsing, response formatting.
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
 */
export async function validateSession(
  request: Request,
  set: Context["set"],
): Promise<{ error?: Response; session?: SessionData }> {
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

/**
 * Formats a profile response with email from session.
 */
export function formatProfileResponse(
  profile: { username: string; bio: string; urls: Array<{ value: string }> },
  email: string,
) {
  return { ...profile, email };
}