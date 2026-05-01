/**
 * MCP API keys repository.
 * Handles all ORM (Drizzle) operations for MCP API keys.
 * All methods return Result types for type-safe error handling.
 */

import { randomUUID } from "uncrypto";
import { db } from "~/config/db";
import { mcpApiKeys, type McpApiKey } from "~/lib/db/schema/mcp";
import { eq, and, desc, sql } from "drizzle-orm";
import { Result, DatabaseError, NotFoundError, DuplicateKeyError } from "~/lib/result";

/**
 * Repository interface for MCP API key database operations.
 * All methods return Result types with explicit error types.
 */
export interface IMcpApiKeyRepository {
  findValidKeyByHash(keyHash: string): Promise<Result<McpApiKey, DatabaseError | NotFoundError>>;
  insertKey(data: {
    name: string;
    keyHash: string;
    userId: string;
    organizationId: string | null;
    permissions: string | null;
    rateLimit: number;
    rateLimitDuration: number;
    expiresAt: Date | null;
  }): Promise<Result<McpApiKey, DatabaseError | DuplicateKeyError>>;
  deleteKeyByIdAndUserId(
    keyId: string,
    userId: string,
  ): Promise<Result<McpApiKey, DatabaseError | NotFoundError>>;
  findKeyByIdAndUserId(
    keyId: string,
    userId: string,
  ): Promise<Result<Pick<McpApiKey, "id" | "userId">, DatabaseError | NotFoundError>>;
  findKeysByUserId(userId: string): Promise<Result<McpApiKey[], DatabaseError>>;
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
  ): Promise<Result<McpApiKey, DatabaseError | NotFoundError>>;
  updateLastUsedAt(keyId: string): Promise<Result<void, DatabaseError>>;
}

/**
 * MCP API keys repository implementation using Drizzle ORM.
 * Uses Result types for explicit error handling.
 */
export class McpApiKeyRepository implements IMcpApiKeyRepository {
  /**
   * Finds a valid (non-expired) API key by its hash.
   */
  async findValidKeyByHash(
    keyHash: string,
  ): Promise<Result<McpApiKey, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        db.query.mcpApiKeys.findFirst({
          where: and(
            eq(mcpApiKeys.keyHash, keyHash),
            sql`((${mcpApiKeys.expiresAt} IS NULL) OR (${mcpApiKeys.expiresAt} > ${new Date()}))`,
          ),
        }),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isOk(result) && result.value === null) {
      return Result.err(new NotFoundError({ resource: "McpApiKey", id: keyHash }));
    }

    return result as Result<McpApiKey, DatabaseError | NotFoundError>;
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
  }): Promise<Result<McpApiKey, DatabaseError | DuplicateKeyError>> {
    const now = new Date();
    const result = await Result.tryPromise({
      try: async () => {
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
      },
      catch: (error) => {
        // Check for unique constraint violation (duplicate key)
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("unique") || (error as any).code === "23505") {
          return new DuplicateKeyError({
            message: "API key with this hash already exists",
            field: "keyHash",
            value: data.keyHash,
          });
        }
        return new DatabaseError({ message, code: (error as any).code });
      },
    });
    return result as Result<McpApiKey, DatabaseError | DuplicateKeyError>;
  }

  /**
   * Deletes a key by ID and user ID (for authorization).
   * Returns the deleted key if found and authorized.
   */
  async deleteKeyByIdAndUserId(
    keyId: string,
    userId: string,
  ): Promise<Result<McpApiKey, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        db
          .delete(mcpApiKeys)
          .where(and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)))
          .returning(),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isOk(result) && (!result.value || (result.value as any[]).length === 0)) {
      return Result.err(new NotFoundError({ resource: "McpApiKey", id: keyId }));
    }

    return result.andThen((records: unknown) => {
      const recordsArray = records as any[];
      return Result.ok(recordsArray[0]);
    }) as Result<McpApiKey, DatabaseError | NotFoundError>;
  }

  /**
   * Finds a key by ID and user ID (lightweight check for ownership).
   */
  async findKeyByIdAndUserId(
    keyId: string,
    userId: string,
  ): Promise<Result<Pick<McpApiKey, "id" | "userId">, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        db.query.mcpApiKeys.findFirst({
          where: and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)),
          columns: { id: true, userId: true },
        }),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isOk(result) && result.value === null) {
      return Result.err(new NotFoundError({ resource: "McpApiKey", id: keyId }));
    }

    return result as Result<Pick<McpApiKey, "id" | "userId">, DatabaseError | NotFoundError>;
  }

  /**
   * Lists all keys for a user.
   */
  async findKeysByUserId(userId: string): Promise<Result<McpApiKey[], DatabaseError>> {
    const result = await Result.tryPromise({
      try: () =>
        db.query.mcpApiKeys.findMany({
          where: eq(mcpApiKeys.userId, userId),
          orderBy: [desc(mcpApiKeys.createdAt)],
        }),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });
    return result as Result<McpApiKey[], DatabaseError>;
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
  ): Promise<Result<McpApiKey, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        db
          .update(mcpApiKeys)
          .set(updates)
          .where(and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)))
          .returning(),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isOk(result) && (!result.value || (result.value as any[]).length === 0)) {
      return Result.err(new NotFoundError({ resource: "McpApiKey", id: keyId }));
    }

    return result.andThen((records: unknown) => {
      const recordsArray = records as any[];
      return Result.ok(recordsArray[0]);
    }) as Result<McpApiKey, DatabaseError | NotFoundError>;
  }

  /**
   * Updates the last used timestamp for a key.
   */
  async updateLastUsedAt(keyId: string): Promise<Result<void, DatabaseError>> {
    return Result.tryPromise({
      try: () =>
        db.update(mcpApiKeys).set({ lastUsedAt: new Date() }).where(eq(mcpApiKeys.id, keyId)),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }
}

/**
 * Singleton instance of the MCP API key repository.
 */
export const mcpApiKeyRepository = new McpApiKeyRepository();