/**
 * MCP API keys service.
 * Contains business logic for API key management, uses repository for DB operations.
 */

import { randomBytes, createHash } from "crypto";
import type { McpApiKey } from "~/lib/db/schema";
import {
  mcpApiKeyRepository,
  type IMcpApiKeyRepository,
} from "~/repositories/mcp/api-keys.repository";
import { logger } from "~/lib/logger";
import { resetRateLimit } from "~/lib/mcp/rate-limit";

const KEY_LENGTH = 32;
const KEY_PREFIX = "mcp_";

/**
 * Service interface for MCP API key operations.
 */
export interface IMcpApiKeyService {
  generateApiKey(): string;
  hashKey(key: string): string;
  validateApiKey(plainKey: string): Promise<McpApiKey | null>;
  createApiKey(options: {
    name: string;
    userId: string;
    organizationId?: string | null;
    permissions?: Record<string, unknown>;
    rateLimit?: number;
    rateLimitDuration?: number;
    expiresAt?: Date;
  }): Promise<{ key: string; record: McpApiKey }>;
  revokeApiKey(keyId: string, userId: string): Promise<boolean>;
  revokeApiKeyWithReason(
    keyId: string,
    userId: string,
  ): Promise<"revoked" | "not_found" | "forbidden">;
  listApiKeys(userId: string): Promise<Omit<McpApiKey, "keyHash">[]>;
  getApiKeyById(keyId: string, userId: string): Promise<Omit<McpApiKey, "keyHash"> | null>;
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
  ): Promise<Omit<McpApiKey, "keyHash"> | null>;
}

/**
 * MCP API keys service implementation.
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
  async validateApiKey(plainKey: string): Promise<McpApiKey | null> {
    const keyHash = this.hashKey(plainKey);
    const result = await this.repository.findValidKeyByHash(keyHash);
    if (result) {
      await this.repository.updateLastUsedAt(result.id);
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
  }): Promise<{ key: string; record: McpApiKey }> {
    const plainKey = this.generateApiKey();
    const keyHash = this.hashKey(plainKey);

    const record = await this.repository.insertKey({
      name: options.name,
      keyHash,
      userId: options.userId,
      organizationId: options.organizationId ?? null,
      permissions: options.permissions ? JSON.stringify(options.permissions) : null,
      rateLimit: options.rateLimit ?? 100,
      rateLimitDuration: options.rateLimitDuration ?? 60_000,
      expiresAt: options.expiresAt ?? null,
    });

    logger.info(`Created MCP API key: ${record.id} for user: ${options.userId}`);
    return { key: plainKey, record };
  }

  /**
   * Revokes (deletes) an API key.
   */
  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const deleted = await this.repository.deleteKeyByIdAndUserId(keyId, userId);
    if (!deleted) return false;

    await resetRateLimit(keyId);
    logger.info(`Revoked MCP API key: ${keyId} by user: ${userId}`);
    return true;
  }

  /**
   * Revokes a key with ownership check, returns reason for API responses.
   */
  async revokeApiKeyWithReason(
    keyId: string,
    userId: string,
  ): Promise<"revoked" | "not_found" | "forbidden"> {
    const owner = await this.repository.findKeyByIdAndUserId(keyId, userId);
    if (!owner) return "not_found";
    if (owner.userId !== userId) return "forbidden";

    await this.revokeApiKey(keyId, userId);
    return "revoked";
  }

  /**
   * Lists all API keys for a user (without key hashes).
   */
  async listApiKeys(userId: string): Promise<Omit<McpApiKey, "keyHash">[]> {
    const keys = await this.repository.findKeysByUserId(userId);
    return keys.map(({ keyHash: _k, ...rest }) => rest);
  }

  /**
   * Gets a key by ID (without hash).
   */
  async getApiKeyById(keyId: string, userId: string): Promise<Omit<McpApiKey, "keyHash"> | null> {
    const key = await this.repository.findKeysByUserId(userId);
    const found = key.find((k) => k.id === keyId);
    if (!found) return null;
    const { keyHash: _k, ...rest } = found;
    return rest;
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
  ): Promise<Omit<McpApiKey, "keyHash"> | null> {
    const existing = await this.getApiKeyById(keyId, userId);
    if (!existing) return null;

    const repoUpdates: Parameters<IMcpApiKeyRepository["updateKeyByIdAndUserId"]>[2] = {
      updatedAt: new Date(),
    };
    if (updates.name) repoUpdates.name = updates.name;
    if (updates.permissions) repoUpdates.permissions = JSON.stringify(updates.permissions);
    if (updates.rateLimit !== undefined) repoUpdates.rateLimit = updates.rateLimit;
    if (updates.rateLimitDuration !== undefined)
      repoUpdates.rateLimitDuration = updates.rateLimitDuration;
    if (updates.expiresAt !== undefined) repoUpdates.expiresAt = updates.expiresAt;

    const updated = await this.repository.updateKeyByIdAndUserId(keyId, userId, repoUpdates);
    if (!updated) return null;

    const { keyHash: _k, ...rest } = updated;
    return rest;
  }
}

/**
 * Singleton instance of the MCP API key service.
 */
export const mcpApiKeyService = new McpApiKeyService();