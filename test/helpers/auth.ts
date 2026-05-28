/**
 * Auth test helpers for API contract tests.
 * Provides utilities for creating authenticated requests
 * and testing auth-related scenarios.
 */

/**
 * Creates a request with a mock Authorization header.
 * Useful for testing protected endpoints that validate bearer tokens.
 *
 * @param url - Full URL including protocol and host
 * @param token - Bearer token value
 * @param method - HTTP method (default: GET)
 * @returns A standard Request object with Authorization header
 */
export const authenticatedRequest = (url: string, token: string, method: string = "GET"): Request =>
  new Request(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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