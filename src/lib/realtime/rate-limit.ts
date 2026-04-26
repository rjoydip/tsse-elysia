/**
 * Per-connection rate limiting for WebSocket messages.
 * Uses in-memory store for synchronous WebSocket message checks.
 */

import { connectionStore } from "./stores/connection";
import { logger } from "~/lib/logger";

/**
 * Realtime-specific rate limit configuration.
 */
export interface RateLimitConfig {
  /** Maximum messages allowed in the window */
  maxMessages: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Enable burst handling */
  allowBurst: boolean;
  /** Burst allowance (extra messages allowed instantly) */
  burstAllowance: number;
}

/**
 * Default rate limit configuration.
 * 60 messages per minute per connection.
 */
export const defaultRateLimitConfig: RateLimitConfig = {
  maxMessages: 60,
  windowMs: 60000,
  allowBurst: true,
  burstAllowance: 5,
};

/**
 * In-memory rate limiter for WebSocket connections.
 * Uses synchronous checks for real-time message handling.
 */
class RealtimeRateLimiter {
  private messageCounts = new Map<string, number[]>();

  /**
   * Checks if a message is allowed under rate limits.
   *
   * @param connectionId - Connection identifier
   * @param config - Rate limit configuration
   * @returns True if allowed, false if rate limited
   */
  check(connectionId: string, config: RateLimitConfig = defaultRateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or initialize message timestamps
    let timestamps = this.messageCounts.get(connectionId) || [];

    // Remove old timestamps outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check burst allowance
    const burstUsed = config.allowBurst ? timestamps.filter((ts) => ts > now - 1000).length : 0;
    const burstRemaining = config.burstAllowance - burstUsed;

    // Check if under limit
    const canSend = timestamps.length < config.maxMessages || burstRemaining > 0;

    if (canSend) {
      timestamps.push(now);
      this.messageCounts.set(connectionId, timestamps);
    }

    return canSend;
  }

  /**
   * Gets remaining message allowance.
   *
   * @param connectionId - Connection identifier
   * @param config - Rate limit configuration
   * @returns Remaining messages allowed
   */
  getRemaining(connectionId: string, config: RateLimitConfig = defaultRateLimitConfig): number {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const timestamps = this.messageCounts.get(connectionId) || [];
    const recentMessages = timestamps.filter((ts) => ts > windowStart).length;

    return Math.max(0, config.maxMessages - recentMessages);
  }

  /**
   * Resets rate limit for a connection.
   *
   * @param connectionId - Connection identifier
   */
  reset(connectionId: string): void {
    this.messageCounts.delete(connectionId);
  }

  /**
   * Cleans up expired entries.
   */
  cleanup(maxAgeMs: number = 300000): void {
    const now = Date.now();
    const cutoff = now - maxAgeMs;

    for (const [id, timestamps] of this.messageCounts) {
      const valid = timestamps.filter((ts) => ts > cutoff);
      if (valid.length === 0) {
        this.messageCounts.delete(id);
      } else {
        this.messageCounts.set(id, valid);
      }
    }
  }
}

/**
 * Singleton rate limiter instance.
 */
export const rateLimiter = new RealtimeRateLimiter();

/**
 * Check rate limit for a WebSocket connection.
 *
 * @param connectionId - Connection identifier
 * @param config - Optional rate limit configuration
 * @returns True if allowed, false if rate limited
 *
 * @example
 * if (!checkRateLimit(connectionId)) {
 *   ws.send(JSON.stringify({ type: 'error', error: { code: 'RATE_LIMITED' } }));
 *   return;
 * }
 */
export function checkRateLimit(
  connectionId: string,
  config: RateLimitConfig = defaultRateLimitConfig,
): boolean {
  const allowed = rateLimiter.check(connectionId, config);

  if (!allowed) {
    logger.warn(`Rate limit exceeded for connection: ${connectionId}`);
  }

  return allowed;
}

/**
 * Gets rate limit status for a connection.
 *
 * @param connectionId - Connection identifier
 * @param config - Optional rate limit configuration
 * @returns Object with remaining allowance and reset time
 */
export function getRateLimitStatus(
  connectionId: string,
  config: RateLimitConfig = defaultRateLimitConfig,
): { remaining: number; resetAt: number } {
  const remaining = rateLimiter.getRemaining(connectionId, config);
  const resetAt = Date.now() + config.windowMs;

  return { remaining, resetAt };
}

/**
 * Resets rate limit for a connection (e.g., on disconnect).
 *
 * @param connectionId - Connection identifier
 */
export function resetRateLimit(connectionId: string): void {
  rateLimiter.reset(connectionId);
}

/**
 * Connection wrapper that applies rate limiting.
 * Wraps the connection store with rate limit checks.
 */
export function createRateLimitedStore() {
  return {
    ...connectionStore,
    sendToUser: (userId: string, message: unknown) => {
      // Rate limit broadcasts per user
      const connections = connectionStore.getByUser(userId);
      let count = 0;
      for (const conn of connections) {
        if (checkRateLimit(conn.metadata.connectionId)) {
          if (conn.socket.readyState === 1) {
            const data = typeof message === "string" ? message : JSON.stringify(message);
            conn.socket.send(data);
            count++;
          }
        }
      }
      return count;
    },
  };
}