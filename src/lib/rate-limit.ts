/**
 * Unified rate limiting library.
 * Provides Redis-backed or in-memory rate limiting.
 *
 * @module rate-limit
 */

export {
  type RateLimitResult,
  type RateLimitStoreInterface,
  getRateLimitStore,
  rateLimitStore,
  memoryRateLimitStore,
  storageRateLimitStore,
  redisRateLimitStore,
  checkRateLimit,
  resetRateLimit,
  cleanupRateLimitStore,
  cleanupRateLimitStoreOnRequest,
} from "./stores/rate-limit";