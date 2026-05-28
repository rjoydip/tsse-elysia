/**
 * Request builder utilities for API contract tests.
 * Provides convenience functions for creating HTTP requests
 * to test Elysia route handlers via app.handle().
 */

/**
 * Creates a JSON HTTP request for testing via app.handle().
 *
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url - Full URL including protocol and host
 * @param body - Optional request body (serialized to JSON)
 * @param headers - Optional additional headers
 * @returns A standard Request object suitable for app.handle()
 */
export const jsonRequest = (
  method: string,
  url: string,
  body?: unknown,
  headers: HeadersInit = {},
): Request =>
  new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

/**
 * Creates a GET request for testing.
 *
 * @param url - Full URL including protocol and host
 * @param headers - Optional additional headers
 * @returns A standard Request object
 */
export const getRequest = (url: string, headers: HeadersInit = {}): Request =>
  new Request(url, { method: "GET", headers });

/**
 * Creates a POST request with JSON body for testing.
 *
 * @param url - Full URL including protocol and host
 * @param body - Request body (serialized to JSON)
 * @param headers - Optional additional headers
 * @returns A standard Request object
 */
export const postRequest = (url: string, body: unknown, headers: HeadersInit = {}): Request =>
  jsonRequest("POST", url, body, headers);

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