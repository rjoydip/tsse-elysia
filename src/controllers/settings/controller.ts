/**
 * Settings controller.
 * Handles HTTP-specific logic: request parsing, response formatting.
 * Session validation is delegated to the shared auth controller.
 */

export { validateSession } from "~/controllers/shared/auth";

/**
 * Formats a profile response with email from session.
 */
export function formatProfileResponse(
  profile: { username: string; bio: string; urls: Array<{ value: string }> },
  email: string,
) {
  return { ...profile, email };
}