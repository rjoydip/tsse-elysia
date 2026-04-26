/**
 * MCP-specific rate limiting.
 * Uses the unified rate-limit store with Redis support.
 */

import {
  checkRateLimit as checkRateLimitBase,
  resetRateLimit as resetRateLimitBase,
  type RateLimitResult,
} from "~/lib/rate-limit";
import type { McpApiKey } from "~/lib/db/core/schema";

/**
 * Re-export types and helpers from unified store.
 */
export type { RateLimitResult } from "~/lib/rate-limit";
export {
  cleanupRateLimitStoreOnRequest,
  cleanupRateLimitStore,
  rateLimitStore,
  memoryRateLimitStore,
} from "~/lib/rate-limit";

/**
 * Check rate limit for an API key.
 * Uses the key's configured rateLimit and rateLimitDuration.
 *
 * @param apiKey - The API key record with rate limit settings
 * @returns Rate limit check result
 */
export async function checkRateLimit(apiKey: McpApiKey): Promise<RateLimitResult> {
  const limit = apiKey.rateLimit ?? 100;
  const duration = apiKey.rateLimitDuration ?? 60_000;

  return checkRateLimitBase(apiKey.id, limit, duration);
}

/**
 * Reset rate limit for an API key (e.g., after successful key revocation).
 */
export async function resetRateLimit(keyId: string): Promise<void> {
  await resetRateLimitBase(keyId);
}

/**
 * Middleware to add rate limit headers to response.
 *
 * @param response - Response object to modify
 * @param limit - Rate limit
 * @param remaining - Remaining requests
 * @param resetAt - Reset timestamp
 * @returns Modified response
 */
export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  resetAt: number,
): Response {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  return response;
}