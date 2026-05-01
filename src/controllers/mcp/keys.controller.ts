/**
 * MCP API keys controller.
 * Handles HTTP-specific logic: validation, request parsing, response formatting.
 * Uses Result types from services for type-safe error handling.
 */

import { NotFoundError, DatabaseError, DuplicateKeyError, ValidationError } from "~/lib/result";
import type { Result } from "better-result";

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
 * Maps a Result error to an appropriate HTTP response.
 * Used to convert tagged errors to HTTP status codes.
 */
export function mapResultErrorToResponse(error: unknown): Response {
  if (error instanceof NotFoundError) {
    return new Response(JSON.stringify({ error: "Not found", resource: error.resource }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof DuplicateKeyError) {
    return new Response(JSON.stringify({ error: "Duplicate entry", field: error.field }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof ValidationError) {
    return new Response(JSON.stringify({ error: "Validation failed", field: error.field }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof DatabaseError) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fallback
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Formats the create API key response (includes the plain key once).
 * Handles the Result type from the service.
 */
export function formatCreateKeyResponse(
  result: Result<
    {
      key: string;
      record: {
        id: string;
        name: string;
        rateLimit: number;
        rateLimitDuration: number;
        createdAt: Date;
      };
    },
    unknown
  >,
): Response {
  return result.match({
    ok: (data) => {
      return new Response(
        JSON.stringify({
          key: data.key,
          id: data.record.id,
          name: data.record.name,
          rateLimit: data.record.rateLimit,
          rateLimitDuration: data.record.rateLimitDuration,
          createdAt: new Date(data.record.createdAt as unknown as string).toISOString(),
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    },
    err: (error) => mapResultErrorToResponse(error),
  });
}

/**
 * Formats the list API keys response with rate limit headers.
 * Handles the Result type from the service.
 */
export function formatListKeysResponse(
  keysResult: Result<Array<Record<string, unknown>>, unknown>,
  rateLimitInfo: { limit: number; remaining: number; resetAt: number } | null,
): Response {
  return keysResult.match({
    ok: (keys) => {
      const response = new Response(JSON.stringify({ keys }), {
        headers: { "Content-Type": "application/json" },
      });

      if (rateLimitInfo) {
        response.headers.set("X-RateLimit-Limit", String(rateLimitInfo.limit));
        response.headers.set("X-RateLimit-Remaining", String(rateLimitInfo.remaining));
        response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimitInfo.resetAt / 1000)));
      }

      return response;
    },
    err: (error) => mapResultErrorToResponse(error),
  });
}

/**
 * Formats the revoke API key response.
 * Handles the Result type from revokeApiKeyWithReason.
 */
export function formatRevokeKeyResponse(
  result: Result<"revoked" | "not_found" | "forbidden", unknown>,
): Response {
  return result.match({
    ok: (outcome) => {
      if (outcome === "not_found") {
        return new Response(JSON.stringify({ error: "Key not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (outcome === "forbidden") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    },
    err: (error) => mapResultErrorToResponse(error),
  });
}

/**
 * Formats the update API key response.
 * Handles the Result type from updateApiKey.
 */
export function formatUpdateKeyResponse(
  result: Result<Record<string, unknown> | null, unknown>,
): Response {
  return result.match({
    ok: (updated) => {
      if (!updated) {
        return new Response(JSON.stringify({ error: "Key not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(updated), {
        headers: { "Content-Type": "application/json" },
      });
    },
    err: (error) => mapResultErrorToResponse(error),
  });
}