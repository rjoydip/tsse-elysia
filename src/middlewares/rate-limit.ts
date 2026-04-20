/**
 * Rate limiting middleware for API protection.
 * Prevents abuse by limiting request frequency per IP or user.
 * Supports tiered limits based on subscription plans.
 */

import { Elysia } from "elysia";
import type { SocketAddress } from "elysia/universal";
import { type Generator, rateLimit, DefaultContext } from "elysia-rate-limit";
import { SUBSCRIPTION_TIERS, DEFAULT_TIER } from "~/types/subscription";
import { getUserSubscriptionTier } from "~/lib/auth";
import { setIdentity } from "~/lib/logger";
import type { EvlogAuthSession } from "~/types/evlog";

/**
 * Determines rate limit configuration based on user subscription tier.
 * Higher tiers get higher limits for more API requests.
 *
 * @param userId - Optional user ID to look up subscription tier
 * @returns Rate limit config with max requests and duration window
 */
async function getRateLimitConfig(userId?: string): Promise<{ max: number; duration: number }> {
  // Anonymous users get default tier limits
  if (!userId) {
    return {
      max: SUBSCRIPTION_TIERS[DEFAULT_TIER].rateLimit,
      duration: SUBSCRIPTION_TIERS[DEFAULT_TIER].rateLimitDuration,
    };
  }

  // Look up user's subscription tier from database
  const tier = await getUserSubscriptionTier(userId);
  const config = SUBSCRIPTION_TIERS[tier] ?? SUBSCRIPTION_TIERS[DEFAULT_TIER];

  return {
    max: config.rateLimit,
    duration: config.rateLimitDuration,
  };
}

/**
 * Custom IP generator for rate limiting scope.
 * Uses user ID when available (authenticated requests), falls back to IP.
 *
 * @param _r - Request object (unused)
 * @param _s - Store object (unused)
 * @param params - Contains IP address and optional userId
 * @returns Rate limit key string
 */
const ipGenerator: Generator<{ ip: SocketAddress; userId?: string }> = async (
  _r,
  _s,
  { ip, userId },
) => {
  // Authenticated users tracked by user ID (consistent across IP changes)
  if (userId) {
    return `user:${userId}`;
  }
  // Anonymous users tracked by IP address
  return ip?.address ?? "unknown";
};

/**
 * Default rate limiting middleware with free tier limits.
 * Applied to all requests as baseline protection.
 *
 * @example
 * // Add to Elysia app:
 * app.use(rateLimitMiddleware)
 */
export const rateLimitMiddleware = new Elysia({ name: "rate-limit" }).use(
  rateLimit({
    duration: SUBSCRIPTION_TIERS[DEFAULT_TIER].rateLimitDuration,
    max: SUBSCRIPTION_TIERS[DEFAULT_TIER].rateLimit,
    headers: true,
    scoping: "scoped",
    countFailedRequest: true,
    errorResponse: new Response(
      JSON.stringify({
        error: "Too many requests",
      }),
      { status: 429 },
    ),
    generator: ipGenerator,
    context: new DefaultContext(10_000),
  }),
);

/**
 * Creates a user-specific rate limit middleware.
 * Use for endpoints requiring higher limits based on subscription.
 *
 * @param userId - User ID to create rate limit config for
 * @returns Elysia middleware with user-specific limits
 *
 * @example
 * const userMiddleware = await createUserRateLimitMiddleware(userId)
 * app.use(userMiddleware)
 */
export async function createUserRateLimitMiddleware(userId: string) {
  const config = await getRateLimitConfig(userId);

  return new Elysia({ name: `rate-limit-user-${userId}` }).use(
    rateLimit({
      duration: config.duration,
      max: config.max,
      headers: true,
      scoping: "scoped",
      countFailedRequest: true,
      errorResponse: new Response(
        JSON.stringify({
          error: "Too many requests",
          message: `Rate limit exceeded for your subscription tier`,
        }),
        { status: 429 },
      ),
      generator: ipGenerator,
      context: new DefaultContext(10_000),
    }),
  );
}

/**
 * Dynamic rate limiting middleware that adapts based on user session.
 * Derives user identity from session cookie and applies appropriate limits.
 * Useful for endpoints that need tier-specific limits.
 *
 * @example
 * // Add to Elysia app for tiered rate limits:
 * app.use(dynamicRateLimitMiddleware)
 */
export const dynamicRateLimitMiddleware = new Elysia({ name: "dynamic-rate-limit" }).derive(
  async ({ cookie }) => {
    const sessionToken = cookie["better-auth.session_token"]?.value;
    let userId: string | undefined;

    // Extract user ID from session if authenticated
    if (sessionToken) {
      const { auth } = await import("~/lib/auth");
      const session = await auth.api.getSession({
        headers: {
          cookie: `better-auth.session_token=${sessionToken}`,
        },
      });
      if (session) {
        setIdentity(session as EvlogAuthSession);
      }
      userId = session?.session?.userId;
    }

    // Get rate limit config based on user (or anonymous)
    const config = await getRateLimitConfig(userId);

    return {
      rateLimit: {
        max: config.max,
        duration: config.duration,
      },
    };
  },
);

// Type for rate limit configuration
export type RateLimitConfig = {
  max: number;
  duration: number;
};