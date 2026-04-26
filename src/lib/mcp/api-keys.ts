/**
 * API key service for MCP authentication.
 * Handles key generation, hashing, validation, and management.
 */

import { randomBytes, createHash } from "crypto";
import { randomUUID } from "uncrypto";
import { db } from "~/config/db";
import { mcpApiKeys, type McpApiKey } from "~/schema/core";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "~/lib/logger";
import { resetRateLimit } from "./rate-limit";

/**
 * Length of the API key (excluding prefix).
 */
const KEY_LENGTH = 32;

/**
 * Prefix for MCP API keys.
 */
const KEY_PREFIX = "mcp_";

/**
 * Generates a cryptographically secure API key.
 * Format: mcp_<random_bytes_hex>
 *
 * @returns Generated API key (plain text - shown only once)
 */
export function generateApiKey(): string {
  const bytes = randomBytes(KEY_LENGTH);
  return `${KEY_PREFIX}${bytes.toString("hex")}`;
}

/**
 * Hashes an API key for secure storage.
 * Uses SHA-256 for hashing (fast, deterministic).
 *
 * @param key - Plain text API key
 * @returns Hashed key for storage
 */
export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validates an API key against the database.
 * Checks key existence, expiration, and retrieves associated metadata.
 *
 * @param key - Plain text API key to validate
 * @returns Validated key record with user/org info, or null if invalid
 */
export async function validateApiKey(key: string): Promise<McpApiKey | null> {
  const keyHash = hashKey(key);

  const result = await db.query.mcpApiKeys.findFirst({
    where: and(
      eq(mcpApiKeys.keyHash, keyHash),
      // Not expired or no expiration
      sql`((${mcpApiKeys.expiresAt} IS NULL) OR (${mcpApiKeys.expiresAt} > ${new Date()}))`,
    ),
  });

  if (result) {
    // Update last used timestamp
    await db.update(mcpApiKeys).set({ lastUsedAt: new Date() }).where(eq(mcpApiKeys.id, result.id));
  }

  return result;
}

/**
 * Creates a new API key for a user.
 *
 * @param options - Key creation options
 * @returns Plain text API key (shown only once) and key record
 */
export async function createApiKey(options: {
  name: string;
  userId: string;
  organizationId?: string | null;
  permissions?: Record<string, unknown>;
  rateLimit?: number;
  rateLimitDuration?: number;
  expiresAt?: Date;
}): Promise<{ key: string; record: McpApiKey }> {
  const plainKey = generateApiKey();
  const keyHash = hashKey(plainKey);

  const now = new Date();
  const [record] = await db
    .insert(mcpApiKeys)
    .values({
      id: randomUUID(),
      name: options.name,
      keyHash,
      userId: options.userId,
      organizationId: options.organizationId ?? null,
      permissions: options.permissions ? JSON.stringify(options.permissions) : null,
      rateLimit: options.rateLimit ?? 100,
      rateLimitDuration: options.rateLimitDuration ?? 60_000,
      expiresAt: options.expiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  logger.info(`Created MCP API key: ${record.id} for user: ${options.userId}`);
  return { key: plainKey, record };
}

/**
 * Revokes an API key by deleting it from the database.
 *
 * @param keyId - ID of the key to revoke
 * @param userId - User who owns the key (for authorization)
 * @returns True if revoked, false if not found or not authorized
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const deleted = await db
    .delete(mcpApiKeys)
    .where(and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)))
    .returning({ id: mcpApiKeys.id });

  if (deleted.length === 0) {
    return false;
  }

  await resetRateLimit(keyId);

  logger.info(`Revoked MCP API key: ${keyId} by user: ${userId}`);
  return true;
}

/**
 * Revokes an API key while distinguishing authorization from existence.
 *
 * @param keyId - ID of the key to revoke
 * @param userId - Requesting user ID used for ownership checks
 * @returns Revoke outcome used by API routes for status-specific responses
 */
export async function revokeApiKeyWithReason(
  keyId: string,
  userId: string,
): Promise<"revoked" | "not_found" | "forbidden"> {
  const ownerLookup = await db.query.mcpApiKeys.findFirst({
    where: eq(mcpApiKeys.id, keyId),
    columns: {
      id: true,
      userId: true,
    },
  });

  if (!ownerLookup) {
    return "not_found";
  }

  if (ownerLookup.userId !== userId) {
    return "forbidden";
  }

  await revokeApiKey(keyId, userId);
  return "revoked";
}

/**
 * Lists all API keys for a user.
 *
 * @param userId - User ID to list keys for
 * @returns Array of key records (without the actual key)
 */
export async function listApiKeys(userId: string): Promise<Omit<McpApiKey, "keyHash">[]> {
  const keys = await db.query.mcpApiKeys.findMany({
    where: eq(mcpApiKeys.userId, userId),
    orderBy: [desc(mcpApiKeys.createdAt)],
  });

  // Remove keyHash from response for security
  const keysList: McpApiKey[] = keys;
  return keysList.map((key) => {
    const { keyHash: _keyHash, ...rest } = key;
    return rest;
  });
}

/**
 * Gets a specific API key by ID (without the hash).
 *
 * @param keyId - Key ID to retrieve
 * @param userId - User who owns the key
 * @returns Key record or null
 */
export async function getApiKeyById(
  keyId: string,
  userId: string,
): Promise<Omit<McpApiKey, "keyHash"> | null> {
  const key = await db.query.mcpApiKeys.findFirst({
    where: and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)),
  });

  if (!key) return null;

  const { keyHash: _keyHash, ...rest } = key;
  return rest;
}

/**
 * Updates an API key's metadata.
 *
 * @param keyId - Key ID to update
 * @param userId - User who owns the key
 * @param updates - Fields to update
 * @returns Updated record or null
 */
export async function updateApiKey(
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
  const existing = await getApiKeyById(keyId, userId);
  if (!existing) return null;

  const [updated] = await db
    .update(mcpApiKeys)
    .set({
      ...(updates.name && { name: updates.name }),
      ...(updates.permissions && {
        permissions: JSON.stringify(updates.permissions),
      }),
      ...(updates.rateLimit !== undefined && { rateLimit: updates.rateLimit }),
      ...(updates.rateLimitDuration !== undefined && {
        rateLimitDuration: updates.rateLimitDuration,
      }),
      ...(updates.expiresAt !== undefined && { expiresAt: updates.expiresAt }),
      updatedAt: new Date(),
    })
    .where(and(eq(mcpApiKeys.id, keyId), eq(mcpApiKeys.userId, userId)))
    .returning();

  if (!updated) return null;

  const { keyHash: _keyHash, ...rest } = updated;
  return rest;
}