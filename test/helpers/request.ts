/**
 * Request builder utilities for API contract tests.
 * Provides convenience functions for creating HTTP requests
 * to test Elysia route handlers via app.handle().
 */

/**
 * Creates an OPTIONS preflight request for CORS testing.
 *
 * @param url - Full URL including protocol and host
 * @param origin - Origin header value
 * @returns A standard Request object
 */
export const optionsRequest = (url: string, origin: string): Request =>
  new Request(url, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "GET",
    },
  });

/**
 * Base URL constant for test requests.
 * The hostname is arbitrary since app.handle() doesn't make real network calls.
 */
export const BASE_URL = "http://localhost";