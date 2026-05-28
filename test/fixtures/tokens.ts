/**
 * Token test fixtures for API contract tests.
 * Provides reusable mock token data for auth testing.
 */

/**
 * Mock JWT token segments for testing.
 * These are not real tokens - they are structurally valid
 * but contain no cryptographic signatures.
 */
export const MOCK_TOKENS = {
  /** Valid-looking access token */
  ACCESS_TOKEN:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJyb2xlIjoidXNlciJ9.test-signature",

  /** Expired token (past expiry date) */
  EXPIRED_TOKEN:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjE1MTYyMzkwMjJ9.test-signature",

  /** Admin role token */
  ADMIN_TOKEN:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi11c2VyLWlkIiwicm9sZSI6ImFkbWluIn0.test-signature",

  /** Malformed token (not a valid JWT) */
  MALFORMED: "not-a-valid-token",
} as const;

/**
 * Creates a mock API key for MCP key testing.
 *
 * @param prefix - Key prefix (default: "mcp_")
 * @returns A mock API key string
 */
export const mockApiKey = (prefix: string = "mcp_") => `${prefix}${"a".repeat(32)}`;