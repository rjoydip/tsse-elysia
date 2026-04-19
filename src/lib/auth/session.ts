/**
 * Unstorage session adapter for Better Auth.
 * Provides distributed session management for multi-instance deployments.
 * Used as a caching layer in front of database sessions.
 *
 * Features:
 * - Unstorage-backed session caching with automatic expiration
 * - In-memory fallback when storage unavailable
 * - Session data serialization
 *
 * @module auth/session
 */

import type { Session } from "better-auth/types";
import { getStorage } from "~/lib/redis";
import { redisLogger } from "~/lib/logger";
import { sessionConfig } from "~/config";

/**
 * Unstorage session adapter.
 * Provides session caching for distributed deployments.
 */
export class StorageSessionAdapter {
  /** Default session TTL from config */
  private readonly defaultExpiresIn = sessionConfig.expiresIn;

  /**
   * Gets the storage instance.
   */
  private getStorageInstance() {
    return getStorage();
  }

  /**
   * Gets a storage key for a session.
   * Uses composite key: session:{userId}:{sessionId} for user-scoped deletion.
   *
   * @param userId - User ID
   * @param sessionId - Session ID
   */
  getKey(userId: string, sessionId: string): string {
    return `session:${userId}:${sessionId}`;
  }

  /**
   * Starts a new session.
   * Stores session data in storage with TTL.
   *
   * @param session - Session data to store
   */
  async create(session: Session): Promise<void> {
    const storage = this.getStorageInstance();
    if (!storage) {
      redisLogger.debug("Storage unavailable, skipping session cache");
      return;
    }

    try {
      const userId = session.userId;
      const key = this.getKey(userId, session.id);
      const expiresIn = session.expiresAt
        ? Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
        : Math.ceil(this.defaultExpiresIn / 1000);

      await storage.setItem(key, JSON.stringify(session), { ttl: expiresIn });

      redisLogger.debug("Session cached", { sessionId: session.id, userId });
    } catch (error) {
      redisLogger.error("Failed to cache session", error as Error);
    }
  }

  /**
   * Gets a session by ID.
   * Note: Requires userId to construct the key.
   *
   * @param sessionId - Session ID
   * @param userId - User ID (required to locate session key)
   * @returns Cached session data or null
   */
  async get(sessionId: string, userId: string): Promise<Session | null> {
    const storage = this.getStorageInstance();
    if (!storage) {
      return null;
    }

    try {
      const key = this.getKey(userId, sessionId);
      const value = await storage.getItem(key);

      if (!value) return null;

      try {
        return JSON.parse(value as string) as Session;
      } catch {
        redisLogger.warn("Failed to parse session JSON", { sessionId });
        return null;
      }
    } catch (error) {
      redisLogger.error("Failed to get cached session", error as Error);
      return null;
    }
  }

  /**
   * Updates session expiration and data.
   *
   * @param session - Updated session
   */
  async update(session: Session): Promise<void> {
    await this.create(session);
  }

  /**
   * Deletes a session from cache.
   *
   * @param sessionId - Session ID to delete
   * @param userId - User ID (required to locate session key)
   */
  async delete(sessionId: string, userId: string): Promise<void> {
    const storage = this.getStorageInstance();
    if (!storage) {
      return;
    }

    try {
      const key = this.getKey(userId, sessionId);
      await storage.removeItem(key);
    } catch (error) {
      redisLogger.error("Failed to delete cached session", error as Error);
    }
  }

  /**
   * Deletes all cached sessions for a user.
   *
   * @param userId - User ID
   */
  async deleteAll(userId: string): Promise<void> {
    const storage = this.getStorageInstance();
    if (!storage) {
      return;
    }

    try {
      const keys = await storage.getKeys(`session:${userId}:`);
      await Promise.all(keys.map((k: string) => storage.removeItem(k)));
    } catch (error) {
      redisLogger.error("Failed to delete user session cache", error as Error);
    }
  }
}

/**
 * Singleton instance for session caching.
 */
export const sessionStorage = new StorageSessionAdapter();

/**
 * @deprecated Use StorageSessionAdapter instead. Kept for backward compatibility.
 */
export const RedisSessionStorage = StorageSessionAdapter;