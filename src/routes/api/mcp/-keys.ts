/**
 * MCP API key management routes plugin.
 *
 * Intent:
 * - Keep route definitions (HTTP layer) here, delegate business logic to services,
 *   and controller-specific validation to controllers.
 * - Mounted under `/api/mcp/keys` by the MCP core routes.
 */

import { Elysia, t } from "elysia";
import { validateMcpAuth } from "~/lib/mcp/auth";
import { mcpApiKeyService } from "~/services/mcp/api-keys";
import {
  validateCreateKeyRequest,
  requireApiKey,
  formatCreateKeyResponse,
  formatListKeysResponse,
} from "~/controllers/mcp/keys.controller";
import { logger } from "~/lib/logger";

const errorExample = { error: "Unauthorized" } as const;
const createKeyResponseExample = {
  key: "mcp_xxx",
  id: "key_123",
  name: "My key",
  rateLimit: 60,
  rateLimitDuration: 60_000,
  createdAt: new Date(0).toISOString(),
} as const;

export const mcpKeysRoutes = new Elysia({
  name: "api.routes.mcp.keys",
  prefix: "/keys",
})
  .derive(async (context) => {
    const authHeader: string | null = context.headers.authorization ?? null;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { apiKey: null, rateLimitInfo: null };
    }

    try {
      const authResult = await validateMcpAuth(authHeader);
      if (!authResult) return { apiKey: null, rateLimitInfo: null };
      return {
        apiKey: { userId: authResult.apiKey.userId },
        rateLimitInfo: authResult.rateLimit,
      };
    } catch (error) {
      logger.error(
        `[MCP keys] auth derive failure: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
      return { apiKey: null, rateLimitInfo: null };
    }
  })
  .get(
    "/",
    async ({ apiKey, rateLimitInfo }) => {
      const { error, userId } = await requireApiKey(apiKey);
      if (error) return error;

      const keys = await mcpApiKeyService.listApiKeys(userId!);
      return formatListKeysResponse(keys, rateLimitInfo);
    },
    {
      detail: {
        tags: ["mcp", "keys"],
        summary: "List API keys",
        description: "List all MCP API keys for the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of API keys" },
          401: {
            description: "Unauthorized",
            content: { "application/json": { example: errorExample } },
          },
        },
      },
    }
  )
  .post(
    "/",
    async ({ apiKey, body, rateLimitInfo }) => {
      const { error, userId } = await requireApiKey(apiKey);
      if (error) return error;

      const { error: validationError, data } = await validateCreateKeyRequest(
        body as Record<string, unknown>
      );
      if (validationError) return validationError;

      const result = await mcpApiKeyService.createApiKey({
        name: data!.name,
        userId: userId!,
        organizationId: data!.organizationId ?? null,
        permissions: data!.permissions,
        rateLimit: data!.rateLimit,
        rateLimitDuration: data!.rateLimitDuration,
        expiresAt: data!.expiresAt ? new Date(data!.expiresAt) : undefined,
      });

      const response = formatCreateKeyResponse(result);
      if (rateLimitInfo) {
        response.headers.set("X-RateLimit-Limit", String(rateLimitInfo.limit));
        response.headers.set(
          "X-RateLimit-Remaining",
          String(rateLimitInfo.remaining)
        );
        response.headers.set(
          "X-RateLimit-Reset",
          String(Math.ceil(rateLimitInfo.resetAt / 1000))
        );
      }
      return response;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        organizationId: t.Optional(t.String()),
        permissions: t.Optional(t.Record(t.String(), t.Unknown())),
        rateLimit: t.Optional(t.Number()),
        rateLimitDuration: t.Optional(t.Number()),
        expiresAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["mcp", "keys"],
        summary: "Create API key",
        description: "Create a new MCP API key",
        security: [{ bearerAuth: [] }],
        responses: {
          201: {
            description: "API key created",
            content: {
              "application/json": { example: createKeyResponseExample },
            },
          },
          400: { description: "Invalid request body" },
          401: {
            description: "Unauthorized",
            content: { "application/json": { example: errorExample } },
          },
        },
      },
    }
  )
  .delete(
    "/:id",
    async ({ apiKey, params }) => {
      const { error, userId } = await requireApiKey(apiKey);
      if (error) return error;

      const outcome = await mcpApiKeyService.revokeApiKeyWithReason(
        params.id,
        userId!
      );
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
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["mcp", "keys"],
        summary: "Revoke API key",
        description: "Revoke (delete) an MCP API key",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Key revoked" },
          401: {
            description: "Unauthorized",
            content: { "application/json": { example: errorExample } },
          },
          403: { description: "Forbidden" },
          404: { description: "Key not found" },
        },
      },
    }
  )
  .put(
    "/:id",
    async ({ apiKey, params, body }) => {
      const { error, userId } = await requireApiKey(apiKey);
      if (error) return error;

      const { name, permissions, rateLimit, rateLimitDuration, expiresAt } =
        body as Record<string, unknown>;
      const updated = await mcpApiKeyService.updateApiKey(params.id, userId!, {
        name: typeof name === "string" ? name : undefined,
        permissions:
          typeof permissions === "object"
            ? (permissions as Record<string, unknown>)
            : undefined,
        rateLimit: typeof rateLimit === "number" ? rateLimit : undefined,
        rateLimitDuration:
          typeof rateLimitDuration === "number" ? rateLimitDuration : undefined,
        expiresAt:
          expiresAt === undefined
            ? undefined
            : expiresAt
            ? new Date(expiresAt as string)
            : null,
      });

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
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        permissions: t.Optional(t.Record(t.String(), t.Unknown())),
        rateLimit: t.Optional(t.Number()),
        rateLimitDuration: t.Optional(t.Number()),
        expiresAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["mcp", "keys"],
        summary: "Update API key",
        description: "Update an MCP API key's settings",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Key updated" },
          401: {
            description: "Unauthorized",
            content: { "application/json": { example: errorExample } },
          },
          404: { description: "Key not found" },
        },
      },
    }
  );
