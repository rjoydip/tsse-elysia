/**
 * MCP API keys controller.
 * Handles HTTP-specific logic: validation, request parsing, response formatting.
 */

import { mcpApiKeyService } from "~/services/mcp/api-keys";

/**
 * Validates the create API key request body.
 * Returns an error response if invalid, otherwise returns the parsed data.
 */
export async function validateCreateKeyRequest(body: Record<string, unknown>): Promise<{
  error?: Response;
  data?: {
    name: string;
    organizationId?: string;
    permissions?: Record<string, unknown>;
    rateLimit?: number;
    rateLimitDuration?: number;
    expiresAt?: string;
  };
}> {
  const { name, organizationId, permissions, rateLimit, rateLimitDuration, expiresAt } = body;

  if (!name || typeof name !== "string") {
    return {
      error: new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return {
    data: {
      name,
      organizationId: typeof organizationId === "string" ? organizationId : undefined,
      permissions:
        typeof permissions === "object" ? (permissions as Record<string, unknown>) : undefined,
      rateLimit: typeof rateLimit === "number" ? rateLimit : undefined,
      rateLimitDuration: typeof rateLimitDuration === "number" ? rateLimitDuration : undefined,
      expiresAt: typeof expiresAt === "string" ? expiresAt : undefined,
    },
  };
}

/**
 * Checks if an API key is present and authenticated.
 * Returns an error response if not, otherwise returns the API key info.
 */
export async function requireApiKey(
  apiKey: { userId: string } | null,
): Promise<{ error?: Response; userId?: string }> {
  if (!apiKey) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { userId: apiKey.userId };
}

/**
 * Formats the create API key response (includes the plain key once).
 */
export function formatCreateKeyResponse(
  result: Awaited<ReturnType<typeof mcpApiKeyService.createApiKey>>,
): Response {
  return new Response(
    JSON.stringify({
      key: result.key,
      id: result.record.id,
      name: result.record.name,
      rateLimit: result.record.rateLimit,
      rateLimitDuration: result.record.rateLimitDuration,
      createdAt: new Date(result.record.createdAt as unknown as string).toISOString(),
    }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
}

/**
 * Formats the list API keys response with rate limit headers.
 */
export function formatListKeysResponse(
  keys: Awaited<ReturnType<typeof mcpApiKeyService.listApiKeys>>,
  rateLimitInfo: { limit: number; remaining: number; resetAt: number } | null,
): Response {
  const response = new Response(JSON.stringify({ keys }), {
    headers: { "Content-Type": "application/json" },
  });

  if (rateLimitInfo) {
    response.headers.set("X-RateLimit-Limit", String(rateLimitInfo.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateLimitInfo.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimitInfo.resetAt / 1000)));
  }

  return response;
}