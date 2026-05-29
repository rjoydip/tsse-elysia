/**
 * Auth test helpers for API contract tests.
 * Provides utilities for testing auth-related scenarios.
 */

/**
 * Creates a request with a malformed Authorization header.
 * Useful for testing auth middleware error handling.
 *
 * @param url - Full URL including protocol and host
 * @returns A standard Request object with invalid auth header
 */
export const malformedAuthRequest = (url: string): Request =>
  new Request(url, {
    headers: {
      Authorization: "NotBearer some-token",
    },
  });

/**
 * Common auth token constants for testing.
 */
export const TEST_TOKENS = {
  /** A valid-looking token for testing (actual validation depends on auth middleware) */
  VALID: "test-valid-token-12345",
  /** An invalid token that should be rejected */
  INVALID: "invalid-token",
  /** A malformed token without the Bearer prefix */
  NO_PREFIX: "mcp_abcdef1234567890",
} as const;