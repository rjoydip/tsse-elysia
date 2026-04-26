/**
 * MCP health rate limiter service.
 * In-memory fixed-window throttling for MCP health probes.
 */

/**
 * Maximum unauthenticated health checks allowed per requester in one time window.
 */
const HEALTH_RATE_LIMIT = 60;

/**
 * Duration of the health endpoint rate-limit window in milliseconds.
 */
const HEALTH_RATE_LIMIT_WINDOW_MS = 60_000;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * In-memory health endpoint limiter keyed by requester identity.
 * This mitigates probing abuse without requiring authenticated API keys.
 */
const healthRequestTracker = new Map<string, RateLimitRecord>();

/**
 * Resolves a best-effort requester key for health endpoint throttling.
 *
 * @param request - Incoming HTTP request
 * @returns Stable key for per-client throttling windows
 */
export function getHealthRequesterKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown";
}

/**
 * Applies fixed-window throttling to MCP health probes.
 *
 * @param request - Incoming request
 * @returns A 429 response when throttled, otherwise null
 */
export function getHealthRateLimitResponse(request: Request): Response | null {
  const now = Date.now();
  const requesterKey = getHealthRequesterKey(request);
  const existing = healthRequestTracker.get(requesterKey);

  for (const [key, record] of healthRequestTracker.entries()) {
    if (now > record.resetAt) {
      healthRequestTracker.delete(key);
    }
  }

  if (!existing || now > existing.resetAt) {
    healthRequestTracker.set(requesterKey, {
      count: 1,
      resetAt: now + HEALTH_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (existing.count >= HEALTH_RATE_LIMIT) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        limit: HEALTH_RATE_LIMIT,
        resetAt: new Date(existing.resetAt).toISOString(),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((existing.resetAt - now) / 1000)),
          "X-RateLimit-Limit": String(HEALTH_RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(existing.resetAt / 1000)),
        },
      },
    );
  }

  existing.count += 1;
  return null;
}

/**
 * Gets the current rate limit tracker for testing purposes.
 */
export function getHealthRequestTracker(): Map<string, RateLimitRecord> {
  return healthRequestTracker;
}