/**
 * MCP API keys repository.
 * Handles all ORM (Drizzle) operations for MCP API keys.
 */

import { randomUUID } from "uncrypto";
import { db } from "~/config/db";
import { mcpApiKeys, type McpApiKey } from "~/lib/db/schema/mcp";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Repository interface for MCP API key database operations.
 */
export interface IMcpApiKeyRepository {
  findValidKeyByHash(keyHash: string): Promise<McpApiKey | null>;
  insertKey(data: {
    name: string;
    keyHash: string;
    userId: string;
    organizationId: string | null;
    permissions: string | null;
    rateLimit: number;
    rateLimitDuration: number;
    expiresAt: Date | null;
  }): Promise<McpApiKey>;
  deleteKeyByIdAndUserId(keyId: string, userId: string): Promise<McpApiKey | null>;
  findKeyByIdAndUserId(
    keyId: string,
    userId: string,
  ): Promise<Pick<McpApiKey, "id" | "userId"> | null>;
  findKeysByUserId(userId: string): Promise<McpApiKey[]>;
  updateKeyByIdAndUserId(
    keyId: string,
    userId: string,
    updates: Partial<{
      name: string;
      permissions: string;
      rateLimit: number;
      rateLimitDuration: number;
      expiresAt: Date | null;
      updatedAt: Date;
    }>,
  ): Promise<McpApiKey | null>;
  updateLastUsedAt(keyId: string): Promise<void>;
}

/**
 * MCP API keys repository implementation using Drizzle ORM.
 */
export class McpApiKeyRepository implements IMcpApiKeyRepository {
  /**
   * Finds a valid (non-expired) API key by its hash.
   */
  async findValidKeyByHash(keyHash: string): Promise<McpApiKey | null> {
    return db.query.mcpApiKeys.findFirst({
      where: and(
        eq(mcpApiKeys.keyHash, keyHash),
        sql`((${mcpApiKeys.expiresAt} IS NULL) OR (${mcpApiKeys.expiresAt} > ${new Date()}))`,
      ),
    });
  }

  /**
   * Inserts a new API key record.
   */
  async insertKey(data: {
    name: string;
    keyHash: string;
    userId: string;
    organizationId: string | null;
    permissions: string | null;
    rateLimit: number;
    rateLimitDuration: number;
    expiresAt: Date | null;
  }): Promise<McpApiKey> {
    const now = new Date();
    const [record] = await db
      .insert(mcpApiKeys)
      .values({
        id: randomUUID(),
        name: data.name,
        keyHash: data.keyHash,
        userId: data.userId,
        organizationId: data.organizationId,
        permissions: data.permissions,
        rateLimit: data.rateLimit,
        rateLimitDuration: data.rateLimitDuration,
        expiresAt: data.expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return record;
  }

  /**
   * Deletes a key by ID and user ID (for authorization).
   * Returns the deleted key if found and authorized.
   */
  async deleteKeyByIdAndUserId(keyId: string, userId: string): Promise<McpApiKey | null> {
    const [deleted] = await db
      .delete(mcpApiKeys)
      .where(and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)))
      .returning();
    return deleted ?? null;
  }

  /**
   * Finds a key by ID and user ID (lightweight check for ownership).
   */
  async findKeyByIdAndUserId(
    keyId: string,
    userId: string,
  ): Promise<Pick<McpApiKey, "id" | "userId"> | null> {
    return db.query.mcpApiKeys.findFirst({
      where: and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)),
      columns: { id: true, userId: true },
    });
  }

  /**
   * Lists all keys for a user.
   */
  async findKeysByUserId(userId: string): Promise<McpApiKey[]> {
    return db.query.mcpApiKeys.findMany({
      where: eq(mcpApiKeys.userId, userId),
      orderBy: [desc(mcpApiKeys.createdAt)],
    });
  }

  /**
   * Updates a key by ID and user ID.
   */
  async updateKeyByIdAndUserId(
    keyId: string,
    userId: string,
    updates: Partial<{
      name: string;
      permissions: string;
      rateLimit: number;
      rateLimitDuration: number;
      expiresAt: Date | null;
      updatedAt: Date;
    }>,
  ): Promise<McpApiKey | null> {
    const [updated] = await db
      .update(mcpApiKeys)
      .set(updates)
      .where(and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)))
      .returning();
    return updated ?? null;
  }

  /**
   * Updates the last used timestamp for a key.
   */
  async updateLastUsedAt(keyId: string): Promise<void> {
    await db.update(mcpApiKeys).set({ lastUsedAt: new Date() }).where(eq(mcpApiKeys.id, keyId));
  }
}

/**
 * Singleton instance of the MCP API key repository.
 */
export const mcpApiKeyRepository = new McpApiKeyRepository();