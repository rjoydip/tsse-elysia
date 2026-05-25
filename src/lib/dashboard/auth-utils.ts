/**
 * Shared authentication utilities for dashboard API routes.
 * Provides consistent auth validation across all dashboard endpoints.
 */

import { auth } from "~/lib/auth";

/**
 * Result of authentication validation.
 */
export interface AuthValidationResult {
  error?: { status: number; message: string };
  userId?: string;
  userRole?: string;
}

/**
 * Validates that the request is authenticated.
 * In development, bypasses auth when TEST_AUTH_BYPASS is set.
 *
 * @param request - The incoming HTTP request
 * @param set - Elysia's set object for setting response status
 * @returns AuthValidationResult with userId on success or error on failure
 */
export async function validateAuthenticated(
  request: Request,
  set: Record<string, unknown>,
): Promise<AuthValidationResult> {
  if (process.env.TEST_AUTH_BYPASS === "true") {
    return { userId: "test-user-id", userRole: "admin" };
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    set.status = 401;
    return { error: { status: 401, message: "Unauthorized" } };
  }

  return { userId: session.user.id };
}