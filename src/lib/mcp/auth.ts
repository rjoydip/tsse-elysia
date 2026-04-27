/**
 * MCP Authentication layer.
 * Manages API key context for tool execution.
 * Uses AsyncLocalStorage for request-scoped context.
 * Includes rate limiting per API key.
 */

import { AsyncLocalStorage } from "async_hooks";
import type { McpApiKey } from "~/lib/db/schema";
import { checkRateLimit, cleanupRateLimitStoreOnRequest, type RateLimitResult } from "./rate-limit";

/**
 * AsyncLocalStorage for storing API key context per-request.
 * Ensures each MCP request has its own isolated context.
 */
const apiKeyStorage = new AsyncLocalStorage<McpApiKey>();

/**
 * Rate limit result storage per request.
 */
const rateLimitStorage = new AsyncLocalStorage<RateLimitResult>();

/**
 * Gets the current API key from the request context.
 * Returns undefined if called outside a request scope.
 */
export function getCurrentApiKey(): McpApiKey | undefined {
  return apiKeyStorage.getStore();
}

/**
 * Gets the rate limit result for the current request.
 */
export function getRateLimitResult(): RateLimitResult | undefined {
  return rateLimitStorage.getStore();
}

/**
 * Runs a function with the API key in its context.
 * Used to wrap MCP tool execution with authenticated context.
 *
 * @param apiKey - The validated API key
 * @param fn - Function to execute with the API key context
 * @returns Result of the function
 */
export function runWithApiKey<T>(apiKey: McpApiKey, fn: () => T): T {
  return apiKeyStorage.run(apiKey, fn);
}

/**
 * Runs a function with API key and rate limit context.
 *
 * @param apiKey - The validated API key
 * @param rateLimitResult - Rate limit check result
 * @param fn - Function to execute
 * @returns Result of the function
 */
export function runWithContext<T>(
  apiKey: McpApiKey,
  rateLimitResult: RateLimitResult,
  fn: () => T,
): T {
  return apiKeyStorage.run(apiKey, () => {
    return rateLimitStorage.run(rateLimitResult, fn);
  });
}

/**
 * Clears the current API key context.
 * Should be called after request processing completes.
 */
export function clearApiKeyContext(): void {
  // AsyncLocalStorage automatically clears when the context exits
}

/**
 * Middleware to extract and validate API key from request.
 * Also performs rate limiting check.
 *
 * @param authHeader - The Authorization header value
 * @returns Validated API key with rate limit info, or null if invalid/rate limited
 */
export async function validateMcpAuth(
  authHeader: string | null,
): Promise<{ apiKey: McpApiKey; rateLimit: RateLimitResult } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const key = authHeader.slice(7); // Remove "Bearer " prefix
  if (!key) {
    return null;
  }
  // Fast-fail obviously invalid keys to avoid unnecessary DB lookups in unauthenticated flows.
  if (!key.startsWith("mcp_")) {
    return null;
  }

  // Import here to avoid circular dependencies
  const { validateApiKey } = await import("./api-keys");
  const apiKey = await validateApiKey(key);

  if (!apiKey) {
    return null;
  }

  // Request-driven cleanup fallback for environments where intervals may be suspended.
  await cleanupRateLimitStoreOnRequest();

  // Check rate limit
  const rateLimit = await checkRateLimit(apiKey);

  if (!rateLimit.allowed) {
    return null;
  }

  return { apiKey, rateLimit };
}

/**
 * Create a rate-limited auth response.
 *
 * @param rateLimit - Rate limit result
 * @returns Response with 429 status and headers
 */
export function createRateLimitedResponse(rateLimit: RateLimitResult): Response {
  const body = JSON.stringify({
    error: "Rate limit exceeded",
    limit: rateLimit.limit,
    resetAt: new Date(rateLimit.resetAt).toISOString(),
  });

  const response = new Response(body, {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
    },
  });

  // Add rate limit headers
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", "0");
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));

  return response;
}