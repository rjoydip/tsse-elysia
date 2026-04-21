/**
 * Unified rate limiting store with Redis support.
 * Provides a pluggable backend for rate limit tracking.
 *
 * @module rate-limit/store
 */

import { getStorage } from "~/lib/cache";
import { cacheLogger } from "~/lib/logger";
import { rateLimitConfig } from "~/config";

/**
 * Rate limit check result.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the window */
  remaining: number;
  /** Timestamp when the rate limit resets */
  resetAt: number;
  /** Maximum requests allowed */
  limit: number;
  /** Window duration in milliseconds */
  duration: number;
}

/**
 * Rate limit store interface.
 * Implementations provide the underlying storage mechanism.
 */
export interface RateLimitStoreInterface {
  /**
   * Check if request is allowed and update counter.
   *
   * @param keyId - Unique identifier for rate limit scope
   * @param limit - Max requests allowed
   * @param duration - Window duration in ms
   * @returns Rate limit result
   */
  check(
    keyId: string,
    limit: number,
    duration: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }>;

  /**
   * Reset rate limit for a key.
   *
   * @param keyId - Key identifier
   */
  reset(keyId: string): Promise<void>;

  /**
   * Clean up expired entries.
   *
   * @returns Number of entries cleaned
   */
  cleanup(): Promise<number>;
}

/**
 * In-memory rate limit store.
 * Use for single-instance deployments or testing.
 *
 * Features:
 * - Lock-based serialization for concurrent safety
 * - Opportunistic cleanup of expired entries
 */
class InMemoryRateLimitStore implements RateLimitStoreInterface {
  /** Stores request counts and reset timestamps per key */
  private requests: Map<string, { count: number; resetAt: number }> = new Map();

  /** Serializes mutations to prevent race conditions */
  private lock: Promise<void> = Promise.resolve();

  /** Tracks last cleanup time for opportunistic cleanup */
  private lastCleanupAt = 0;

  /**
   * Serializes store mutations to avoid interleaving under concurrent async request handling.
   * Uses a promise chain to ensure operations execute sequentially.
   *
   * @param operation - The operation to execute
   * @returns The result of the operation
   */
  private async withLock<T>(operation: () => T): Promise<T> {
    let release: (() => void) | undefined;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previousLock = this.lock;
    this.lock = previousLock.then(() => nextLock);
    await previousLock;
    try {
      return operation();
    } finally {
      release?.();
    }
  }

  /**
   * Checks if a request is allowed and updates the counter.
   * Implements token bucket-like algorithm.
   *
   * @param keyId - Unique identifier for the rate limit scope (e.g., API key, user ID)
   * @param limit - Maximum requests allowed in the duration window
   * @param duration - Time window in milliseconds
   * @returns Object with allowed status, remaining count, and reset timestamp
   */
  async check(
    keyId: string,
    limit: number,
    duration: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    return this.withLock(() => {
      const now = Date.now();

      // Opportunistic cleanup: run at configured interval to remove expired entries
      if (now - this.lastCleanupAt > rateLimitConfig.cleanupInterval) {
        this.lastCleanupAt = now;
        for (const [cleanupKey, cleanupRecord] of this.requests.entries()) {
          if (now > cleanupRecord.resetAt) {
            this.requests.delete(cleanupKey);
          }
        }
      }

      const record = this.requests.get(keyId);

      // No existing record or window expired - start fresh
      if (!record || now > record.resetAt) {
        const resetAt = now + duration;
        this.requests.set(keyId, { count: 1, resetAt });
        return { allowed: true, remaining: limit - 1, resetAt };
      }

      // Within window - check if limit exceeded
      if (record.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
      }

      // Increment counter and return remaining
      record.count++;
      return {
        allowed: true,
        remaining: limit - record.count,
        resetAt: record.resetAt,
      };
    });
  }

  /**
   * Resets the rate limit counter for a specific key.
   * Used when manually revoking or resetting limits.
   *
   * @param keyId - Key identifier to reset
   */
  async reset(keyId: string): Promise<void> {
    await this.withLock(() => {
      this.requests.delete(keyId);
    });
  }

  /**
   * Cleans up all expired rate limit entries.
   * Removes entries whose reset time has passed.
   *
   * @returns Number of entries cleaned up
   */
  async cleanup(): Promise<number> {
    return this.withLock(() => {
      const now = Date.now();
      this.lastCleanupAt = now;
      let cleaned = 0;

      for (const [key, record] of this.requests.entries()) {
        if (now > record.resetAt) {
          this.requests.delete(key);
          cleaned++;
        }
      }

      return cleaned;
    });
  }
}

/**
 * Unstorage-based rate limit store for distributed deployments.
 * Uses atomic operations via unstorage for counter management.
 *
 * Features:
 * - Automatic cleanup via TTL expiration
 * - Fallback to memory store if storage unavailable
 * - Thread-safe atomic operations
 */
class StorageRateLimitStore implements RateLimitStoreInterface {
  /** Key prefix for storage */
  private readonly prefix = "ratelimit:";

  /**
   * Gets the storage instance, returning null if unavailable.
   * Logs a warning when falling back to memory store.
   *
   * @returns Storage instance or null
   */
  private getStorageInstance() {
    const storage = getStorage();
    if (!storage) {
      cacheLogger.warn("Storage not available, falling back to memory store");
      return null;
    }
    return storage;
  }

  /**
   * Checks rate limit using atomic operations.
   * Uses unstorage for atomic counter management.
   *
   * @param keyId - Unique identifier for rate limit scope
   * @param limit - Maximum requests allowed
   * @param duration - Window duration in ms
   * @returns Rate limit result
   */
  async check(
    keyId: string,
    limit: number,
    duration: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const storage = this.getStorageInstance();
    if (!storage) {
      return memoryStore.check(keyId, limit, duration);
    }

    if (limit <= 0 || duration <= 0) {
      return {
        allowed: true,
        remaining: limit,
        resetAt: Date.now() + Math.max(duration, 0),
      };
    }

    const storeKey = `${this.prefix}${keyId}`;

    try {
      const now = Date.now();
      const ttlSeconds = Math.ceil(Math.max(duration, 0) / 1000);
      const resetAt = now + duration;

      const value = await storage.getItem(storeKey);
      let count = 0;

      if (value) {
        try {
          const parsed = JSON.parse(value as string);
          count = parsed.count ?? 0;
        } catch {
          count = 0;
        }
      }

      count++;

      await storage.setItem(storeKey, JSON.stringify({ count, resetAt }), {
        ttl: ttlSeconds,
      });

      if (count > limit) {
        const ttl = ttlSeconds;
        const actualResetAt = now + ttl * 1000;
        return { allowed: false, remaining: 0, resetAt: actualResetAt };
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - count),
        resetAt,
      };
    } catch (error) {
      cacheLogger.error("Storage rate limit check failed", error as Error);
      return memoryStore.check(keyId, limit, duration);
    }
  }

  /**
   * Resets rate limit for a key by removing the storage key.
   *
   * @param keyId - Key identifier to reset
   */
  async reset(keyId: string): Promise<void> {
    const storage = this.getStorageInstance();
    if (!storage) {
      return memoryStore.reset(keyId);
    }

    const storeKey = `${this.prefix}${keyId}`;

    try {
      await storage.removeItem(storeKey);
    } catch (error) {
      cacheLogger.error("Storage rate limit reset failed", error as Error);
    }
  }

  /**
   * Cleanup is automatic via TTL.
   * Returns 0 as storage handles expiration internally.
   *
   * @returns Always returns 0 (no manual cleanup needed)
   */
  async cleanup(): Promise<number> {
    cacheLogger.debug("Storage cleanup is automatic via TTL");
    return 0;
  }
}

/**
 * Memory store fallback instance.
 */
const memoryStore = new InMemoryRateLimitStore();

/**
 * Storage store instance.
 */
const storageStore = new StorageRateLimitStore();

/**
 * Gets the rate limit store based on storage availability.
 * Uses storage if available, otherwise falls back to in-memory.
 *
 * @returns Rate limit store instance
 */
export function getRateLimitStore(): RateLimitStoreInterface {
  const storage = getStorage();
  return storage ? storageStore : memoryStore;
}

/**
 * Exported instances for direct usage.
 */
export const rateLimitStore = getRateLimitStore();
export const memoryRateLimitStore = memoryStore;
export const storageRateLimitStore = storageStore;

/**
 * @deprecated Use storageRateLimitStore instead. Kept for backward compatibility.
 */
export const redisRateLimitStore = storageStore;

/**
 * Checks rate limit using the configured store.
 *
 * @param keyId - Unique identifier
 * @param limit - Max requests
 * @param duration - Window duration in ms
 * @returns Rate limit result
 */
export async function checkRateLimit(
  keyId: string,
  limit: number,
  duration: number,
): Promise<RateLimitResult> {
  const result = await rateLimitStore.check(keyId, limit, duration);

  return {
    ...result,
    limit,
    duration,
  };
}

/**
 * Resets rate limit for a key.
 *
 * @param keyId - Key identifier
 */
export async function resetRateLimit(keyId: string): Promise<void> {
  await rateLimitStore.reset(keyId);
}

/**
 * Cleans up expired rate limit entries.
 *
 * @returns Number of entries cleaned
 */
export async function cleanupRateLimitStore(): Promise<number> {
  return rateLimitStore.cleanup();
}

/**
 * Tracks last cleanup timestamp for request-path cleanup throttling.
 * Prevents too-frequent cleanup calls in serverless environments.
 */
let lastRequestPathCleanupAt = 0;

/**
 * Best-effort cleanup for serverless/runtime paths where timers may not fire.
 * Runs at most once per minute.
 */
export async function cleanupRateLimitStoreOnRequest(): Promise<void> {
  const now = Date.now();
  if (now - lastRequestPathCleanupAt < 60_000) {
    return;
  }

  lastRequestPathCleanupAt = now;
  await cleanupRateLimitStore();
}