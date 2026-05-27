/**
 * MCP API keys service.
 * Contains business logic for API key management, uses repository for DB operations.
 * All methods return Result types for type-safe error handling.
 */

import { randomBytes, createHash } from "crypto";
import type { McpApiKey } from "~/lib/db/schema/mcp";
import {
  mcpApiKeyRepository,
  type IMcpApiKeyRepository,
} from "~/repositories/mcp/api-keys.repository";
import { logger } from "~/lib/logger";
import { resetRateLimit } from "~/lib/mcp/rate-limit";
import { Result, DatabaseError, NotFoundError, DuplicateKeyError } from "~/lib/result";

const KEY_LENGTH = 32;
const KEY_PREFIX = "mcp_";

/**
 * Service interface for MCP API key operations.
 * All methods return Result types with explicit error types.
 */
export interface IMcpApiKeyService {
  generateApiKey(): string;
  hashKey(key: string): string;
  validateApiKey(plainKey: string): Promise<Result<McpApiKey, DatabaseError | NotFoundError>>;
  createApiKey(options: {
    name: string;
    userId: string;
    organizationId?: string | null;
    permissions?: Record<string, unknown>;
    rateLimit?: number;
    rateLimitDuration?: number;
    expiresAt?: Date;
  }): Promise<Result<{ key: string; record: McpApiKey }, DatabaseError | DuplicateKeyError>>;
  revokeApiKey(
    keyId: string,
    userId: string,
  ): Promise<Result<boolean, DatabaseError | NotFoundError>>;
  revokeApiKeyWithReason(
    keyId: string,
    userId: string,
  ): Promise<Result<"revoked" | "not_found" | "forbidden", DatabaseError | NotFoundError>>;
  listApiKeys(userId: string): Promise<Result<Omit<McpApiKey, "keyHash">[], DatabaseError>>;
  getApiKeyById(
    keyId: string,
    userId: string,
  ): Promise<Result<Omit<McpApiKey, "keyHash"> | null, DatabaseError | NotFoundError>>;
  updateApiKey(
    keyId: string,
    userId: string,
    updates: {
      name?: string;
      permissions?: Record<string, unknown>;
      rateLimit?: number;
      rateLimitDuration?: number;
      expiresAt?: Date | null;
    },
  ): Promise<Result<Omit<McpApiKey, "keyHash"> | null, DatabaseError | NotFoundError>>;
}

/**
 * MCP API keys service implementation.
 * Uses Result types for explicit error handling.
 */
export class McpApiKeyService implements IMcpApiKeyService {
  private repository: IMcpApiKeyRepository;

  constructor(repository: IMcpApiKeyRepository = mcpApiKeyRepository) {
    this.repository = repository;
  }

  /**
   * Generates a cryptographically secure API key.
   */
  generateApiKey(): string {
    const bytes = randomBytes(KEY_LENGTH);
    return `${KEY_PREFIX}${bytes.toString("hex")}`;
  }

  /**
   * Hashes an API key for secure storage.
   */
  hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }

  /**
   * Validates an API key and updates last used timestamp.
   */
  async validateApiKey(
    plainKey: string,
  ): Promise<Result<McpApiKey, DatabaseError | NotFoundError>> {
    const keyHash = this.hashKey(plainKey);
    const result = await this.repository.findValidKeyByHash(keyHash);

    if (Result.isOk(result)) {
      // Update last used timestamp (fire and forget, don't fail validation if this fails)
      this.repository.updateLastUsedAt(result.value.id).catch((err: Error) => {
        logger.error("Failed to update last used timestamp", err);
      });
      return result;
    }

    return result;
  }

  /**
   * Creates a new API key.
   */
  async createApiKey(options: {
    name: string;
    userId: string;
    organizationId?: string | null;
    permissions?: Record<string, unknown>;
    rateLimit?: number;
    rateLimitDuration?: number;
    expiresAt?: Date;
  }): Promise<Result<{ key: string; record: McpApiKey }, DatabaseError | DuplicateKeyError>> {
    const plainKey = this.generateApiKey();
    const keyHash = this.hashKey(plainKey);

    const insertResult = await this.repository.insertKey({
      name: options.name,
      keyHash,
      userId: options.userId,
      organizationId: options.organizationId ?? null,
      permissions: options.permissions ? JSON.stringify(options.permissions) : null,
      rateLimit: options.rateLimit ?? 100,
      rateLimitDuration: options.rateLimitDuration ?? 60_000,
      expiresAt: options.expiresAt ?? null,
    });

    return insertResult.andThen((record) => {
      logger.info(`Created MCP API key: ${record.id} for user: ${options.userId}`);
      return Result.ok({ key: plainKey, record });
    });
  }

  /**
   * Revokes (deletes) an API key.
   */
  async revokeApiKey(
    keyId: string,
    userId: string,
  ): Promise<Result<boolean, DatabaseError | NotFoundError>> {
    const deleteResult = await this.repository.deleteKeyByIdAndUserId(keyId, userId);

    return deleteResult.andThen((deleted) => {
      if (!deleted) return Result.ok(false);

      resetRateLimit(keyId).catch((err: Error) => {
        logger.error("Failed to reset rate limit", err);
      });
      logger.info(`Revoked MCP API key: ${keyId} by user: ${userId}`);
      return Result.ok(true);
    });
  }

  /**
   * Revokes a key with ownership check, returns reason for API responses.
   */
  async revokeApiKeyWithReason(
    keyId: string,
    userId: string,
  ): Promise<Result<"revoked" | "not_found" | "forbidden", DatabaseError | NotFoundError>> {
    const ownerResult = await this.repository.findKeyByIdAndUserId(keyId, userId);

    if (Result.isError(ownerResult)) {
      if (ownerResult.error instanceof NotFoundError) {
        return Result.ok("not_found" as const);
      }
      return Result.err(ownerResult.error);
    }

    // Check ownership
    if (ownerResult.value.userId !== userId) {
      return Result.ok("forbidden" as const);
    }

    const revokeResult = await this.revokeApiKey(keyId, userId);
    if (Result.isError(revokeResult)) {
      return Result.err(revokeResult.error);
    }

    return Result.ok("revoked" as const);
  }

  /**
   * Lists all API keys for a user (without key hashes).
   */
  async listApiKeys(userId: string): Promise<Result<Omit<McpApiKey, "keyHash">[], DatabaseError>> {
    const keysResult = await this.repository.findKeysByUserId(userId);

    return keysResult.andThen((keys: unknown) => {
      const typedKeys = keys as McpApiKey[];
      const sanitized = typedKeys.map(({ keyHash: _k, ...rest }) => rest);
      return Result.ok(sanitized);
    });
  }

  /**
   * Gets a key by ID (without hash).
   */
  async getApiKeyById(
    keyId: string,
    userId: string,
  ): Promise<Result<Omit<McpApiKey, "keyHash"> | null, DatabaseError | NotFoundError>> {
    const keysResult = await this.repository.findKeysByUserId(userId);

    return keysResult.andThen((keys) => {
      const found = keys.find((k) => k.id === keyId);
      if (!found) return Result.ok(null);
      const { keyHash: _k, ...rest } = found;
      return Result.ok(rest);
    });
  }

  /**
   * Updates a key's metadata.
   */
  async updateApiKey(
    keyId: string,
    userId: string,
    updates: {
      name?: string;
      permissions?: Record<string, unknown>;
      rateLimit?: number;
      rateLimitDuration?: number;
      expiresAt?: Date | null;
    },
  ): Promise<Result<Omit<McpApiKey, "keyHash"> | null, DatabaseError | NotFoundError>> {
    // Check if key exists and belongs to user
    const existingResult = await this.getApiKeyById(keyId, userId);
    if (Result.isError(existingResult) || existingResult.value === null) {
      return existingResult;
    }

    const repoUpdates: Parameters<IMcpApiKeyRepository["updateKeyByIdAndUserId"]>[2] = {
      updatedAt: new Date(),
    };
    if (updates.name) repoUpdates.name = updates.name;
    if (updates.permissions) repoUpdates.permissions = JSON.stringify(updates.permissions);
    if (updates.rateLimit !== undefined) repoUpdates.rateLimit = updates.rateLimit;
    if (updates.rateLimitDuration !== undefined)
      repoUpdates.rateLimitDuration = updates.rateLimitDuration;
    if (updates.expiresAt !== undefined) repoUpdates.expiresAt = updates.expiresAt;

    const updateResult = await this.repository.updateKeyByIdAndUserId(keyId, userId, repoUpdates);
    if (Result.isError(updateResult)) {
      return updateResult;
    }

    if (!updateResult.value) {
      return Result.ok(null);
    }

    const { keyHash: _k, ...rest } = updateResult.value;
    return Result.ok(rest);
  }
}

/**
 * Singleton instance of the MCP API key service.
 */
export const mcpApiKeyService = new McpApiKeyService();