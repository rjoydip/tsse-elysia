/**
 * Cache-backed caching layer.
 * Provides a simple key-value cache with TTL support.
 *
 * Features:
 * - Cache backend with automatic TTL expiration
 * - In-memory fallback when Cache unavailable
 * - JSON serialization for complex values
 * - Cache invalidation support
 *
 * @module cache
 */

import { createStorage, type Storage } from "unstorage";
import redisDriver from "unstorage/drivers/redis";
import lruCacheDriver from "unstorage/drivers/lru-cache";
import dbDriver from "unstorage/drivers/db0";
import { createDatabase } from "db0";
import postgresql from "db0/connectors/postgresql";
import { env } from "~/config/env";
import { cacheLogger } from "~/lib/logger";

/**
 * Cache entry with metadata.
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache options.
 */
export interface CacheOptions {
  /** Time to live in seconds (default: 300 = 5 minutes) */
  ttl?: number;
  /** Namespace prefix for cache keys */
  namespace?: string;
}

/**
 * Default cache TTL: 5 minutes.
 */
const DEFAULT_TTL = 300;

/**
 * Cache key prefix.
 */
const DEFAULT_NAMESPACE = "cache";

/**
 * In-memory cache store for fallback.
 */
class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Gets a value from cache.
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Sets a value in cache.
   */
  async set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Deletes a key from cache.
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Clears all entries in a namespace.
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Checks if a key exists in cache.
   */
  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }
}

/**
 * Unstorage-backed cache store.
 */
class StorageCache {
  private readonly prefix: string;

  constructor(namespace: string = DEFAULT_NAMESPACE) {
    this.prefix = `${namespace}:`;
  }

  /**
   * Gets the storage instance.
   */
  private getStorageInstance() {
    return getStorage();
  }

  /**
   * Gets a value from cache.
   *
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    const storage = this.getStorageInstance();
    if (!storage) {
      return memoryCache.get<T>(key);
    }

    try {
      const storeKey = `${this.prefix}${key}`;
      const value = await storage.getItem(storeKey);
      if (!value) return null;

      // Try to parse as JSON, if that fails return as-is (for strings)
      try {
        return JSON.parse(value as string) as T;
      } catch {
        // If JSON parse fails, return the value directly
        return value as T;
      }
    } catch (error) {
      cacheLogger.error("Storage cache get failed", error as Error);
      return memoryCache.get<T>(key);
    }
  }

  /**
   * Sets a value in cache.
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    const ttlSecondsInt = ttlSeconds > 0 ? Math.floor(ttlSeconds) : DEFAULT_TTL;

    const storage = this.getStorageInstance();
    if (!storage) {
      memoryCache.set(key, value, ttlSecondsInt);
      return;
    }

    try {
      const storeKey = `${this.prefix}${key}`;
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      await storage.setItem(storeKey, serialized, { ttl: ttlSecondsInt });
    } catch (error) {
      cacheLogger.error("Storage cache set failed", error as Error);
      memoryCache.set(key, value, ttlSecondsInt);
    }
  }

  /**
   * Deletes a key from cache.
   *
   * @param key - Cache key to delete
   */
  async delete(key: string): Promise<void> {
    const storage = this.getStorageInstance();
    if (!storage) {
      memoryCache.delete(key);
      return;
    }

    try {
      const storeKey = `${this.prefix}${key}`;
      await storage.removeItem(storeKey);
    } catch (error) {
      cacheLogger.error("Storage cache delete failed", error as Error);
    }
  }

  /**
   * Clears all keys in the namespace.
   */
  async clear(): Promise<void> {
    const storage = this.getStorageInstance();
    if (!storage) {
      await memoryCache.clear();
      return;
    }

    try {
      const keys = await storage.getKeys(this.prefix);
      await Promise.all(keys.map((k: string) => storage.removeItem(k)));
    } catch (error) {
      cacheLogger.error("Storage cache clear failed", error as Error);
    }
  }

  /**
   * Checks if a key exists in cache.
   *
   * @param key - Cache key
   * @returns True if key exists
   */
  async has(key: string): Promise<boolean> {
    const storage = this.getStorageInstance();
    if (!storage) {
      return memoryCache.has(key);
    }

    try {
      const storeKey = `${this.prefix}${key}`;
      const value = await storage.getItem(storeKey);
      return value !== null && value !== undefined;
    } catch (error) {
      cacheLogger.error("Storage cache has failed", error as Error);
      return memoryCache.has(key);
    }
  }
}

/**
 * Memory cache fallback instance.
 */
const memoryCache = new MemoryCache();

/**
 * Redis cache instance (for type inference).
 */
export const redisCache = new StorageCache();

/**
 * Cache interface for type-safe operations.
 */
export interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Gets a cache instance based on storage availability.
 *
 * @param options - Cache options
 * @returns Cache interface instance
 */
export function getCache(options: CacheOptions = {}): CacheInterface {
  const storage = getStorage();
  if (storage) {
    return new StorageCache(options.namespace);
  }
  return memoryCache as unknown as CacheInterface;
}

/**
 * Default cache instance.
 */
export const cache = {
  get: <T>(key: string): Promise<T | null> => getCache().get<T>(key),
  set: <T>(key: string, value: T, ttlSeconds?: number): Promise<void> =>
    getCache().set(key, value, ttlSeconds),
  delete: (key: string): Promise<void> => getCache().delete(key),
  clear: (): Promise<void> => getCache().clear(),
  has: (key: string): Promise<boolean> => getCache().has(key),
};

/**
 * Gets a cached value.
 *
 * @param key - Cache key
 * @returns Cached value or null
 */
export async function getCached<T>(key: string): Promise<T | null> {
  return cache.get<T>(key);
}

/**
 * Sets a cached value.
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds
 */
export async function setCached<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  return cache.set(key, value, ttlSeconds);
}

/**
 * Deletes a cached value.
 *
 * @param key - Cache key
 */
export async function deleteCached(key: string): Promise<void> {
  return cache.delete(key);
}

/**
 * Clears the cache.
 */
export async function clearCache(): Promise<void> {
  return cache.clear();
}

/**
 * Checks if a key is cached.
 *
 * @param key - Cache key
 * @returns True if cached
 */
export async function isCached(key: string): Promise<boolean> {
  return cache.has(key);
}

/**
 * Universal storage abstraction layer using unstorage.
 * Supports multiple storage backends based on environment configuration:
 *
 * - Redis:    When REDIS_URL is set in environment
 * - LRU:     Default in-memory cache
 * - Postgres: When POSTGRES_URL or NEON_DATABASE_URL is set
 *
 * Provides a unified API for key-value storage operations across all backends.
 * The storage is optional — when no backend is configured, all operations
 * gracefully degrade to no-op behavior.
 *
 * @module cache
 * @see https://unstorage.unjs.io
 */

/**
 * Storage connection status for health checks.
 * Used by the status endpoint to report storage availability.
 */
export interface StorageStatus {
  /** Whether storage is currently connected */
  connected: boolean;
  /** Storage backend type (redis, lru, or postgres) */
  backend: string;
  /** URL or connection info (masked for security) */
  url: string;
  /** Error message if connection failed */
  error?: string;
}

/** Unstorage instance */
let storage: Storage | null = null;

/** Track which backend is being used */
let cacheType: "redis" | "lru" | "postgres" | null = null;

/** Track initialization state */
let initialized = false;

/**
 * Masks sensitive parts of a connection URL for logging.
 * Preserves host and port but hides passwords and tokens.
 *
 * @param url - Raw connection URL
 * @returns Masked URL safe for logging
 *
 * @example
 * maskUrl("postgresql://user:secret@host:5432") // "postgresql://user:***@host:5432"
 */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.username) {
      parsed.username = "***";
    }
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return "***";
  }
}

/**
 * Determines the storage backend based on environment configuration.
 * Priority: REDIS_URL > postgres > sqlite (lru)
 */
function getBackendConfig(): {
  backend: "redis" | "lru" | "postgres";
  url: string;
} {
  // Priority 1: Redis URL is set
  if (env.REDIS_URL) {
    return { backend: "redis", url: env.REDIS_URL };
  }

  // Priority 2: PostgreSQL is configured (any PG driver)
  if (env.POSTGRES_URL || env.NEON_DATABASE_URL) {
    const postgresUrl = env.POSTGRES_URL || env.NEON_DATABASE_URL!;
    return { backend: "postgres", url: postgresUrl };
  }

  // Default: SQLite (use LRU cache for in-memory storage)
  return { backend: "lru", url: "in-memory" };
}

/**
 * Creates and initializes the storage instance based on backend configuration.
 *
 * @returns Configured storage instance or null if initialization failed
 */
function createStorageInstance(): Storage | null {
  const config = getBackendConfig();
  cacheType = config.backend;

  cacheLogger.info(`Initializing cache storage with ${config.backend}`, {
    url: maskUrl(config.url),
  });

  let storageInstance: Storage | null = null;

  try {
    switch (config.backend) {
      case "redis": {
        storageInstance = createStorage({
          driver: redisDriver({
            base: "tss",
            url: env.REDIS_URL,
            // Lazy initialization - connect on first operation
            preConnect: false,
          }),
        });
        break;
      }

      case "postgres": {
        const db0 = createDatabase(
          postgresql({
            url: env.POSTGRES_URL ?? "",
          }),
        );
        storageInstance = createStorage({
          driver: dbDriver({
            database: db0,
            tableName: "tss_storage",
          }),
        });
        break;
      }

      default: {
        storageInstance = createStorage({
          driver: lruCacheDriver({
            // Default max items
            max: 1000,
          }),
        });
        break;
      }
    }

    storage = storageInstance;
    // Persist across Vite HMR cycles
    (globalThis as unknown as Record<string, Storage | null>)[STORAGE_GLOBAL_KEY] = storageInstance;
    cacheLogger.info(`Storage initialized with ${config.backend} backend`);
    return storageInstance;
  } catch (error) {
    cacheLogger.error(`Failed to initialize ${config.backend} storage`, error as Error);
    return null;
  } finally {
    initialized = true;
  }
}

/**
 * Key used to persist the storage instance across Vite HMR cycles
 * where module-level state is reset on every file save.
 */
const STORAGE_GLOBAL_KEY = "___tsse_elysia_storage_instance";

/**
 * Returns the storage singleton.
 * Creates the storage on first call (lazy initialization).
 *
 * Uses a globalThis reference to survive Vite HMR module reloads.
 * Returns null if no storage backend is configured, allowing the app
 * to run gracefully without storage.
 *
 * @returns Storage instance or null if unavailable
 */
export function getStorage(): Storage | null {
  // Check globalThis first to survive HMR module re-evaluation
  const globalStorage = (globalThis as unknown as Record<string, Storage | null>)[
    STORAGE_GLOBAL_KEY
  ];
  if (globalStorage) {
    storage = globalStorage;
    return storage;
  }

  if (!initialized) {
    createStorageInstance();
  }

  return storage;
}

/** Tracks whether storage connection has been validated */
let validated = false;

/**
 * Validates storage connection on first access.
 * Ensures the storage can communicate before returning.
 * Safe to call multiple times - validation runs once.
 */
export async function ensureStorageConnection(): Promise<boolean> {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  if (validated) {
    return storage !== null;
  }

  validated = true;
  return validateStorageConnection();
}

/**
 * Validates storage connectivity by attempting a read operation.
 * Ensures the storage is accessible before operations.
 *
 * @returns True if connection is working, false otherwise
 */
export async function validateStorageConnection(): Promise<boolean> {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    // Attempt a test operation to verify connectivity
    await storage.get("__health_check__");
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks storage connectivity.
 * Used by the health check endpoint to report storage status.
 *
 * @returns Storage connection status object
 */
export async function getStorageStatus(): Promise<StorageStatus> {
  const storage = getStorage();
  const config = getBackendConfig();

  if (!storage) {
    return {
      connected: false,
      backend: config.backend,
      url: maskUrl(config.url),
      error: "Storage not configured",
    };
  }

  try {
    // Attempt a test operation to verify connectivity
    await storage.get("__health_check__");
    return {
      connected: true,
      backend: config.backend,
      url: maskUrl(config.url),
    };
  } catch (error) {
    return {
      connected: false,
      backend: config.backend,
      url: maskUrl(config.url),
      error: (error as Error).message,
    };
  }
}

/**
 * Gracefully closes the storage connection.
 * Should be called during application shutdown to clean up resources.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function closeStorage(): void {
  if (storage) {
    cacheLogger.info(`Closing ${cacheType} storage`);
    // Clear the storage instance and HMR persistence key
    storage = null;
    delete (globalThis as Record<string, unknown>)[STORAGE_GLOBAL_KEY];
    initialized = false;
    cacheType = null;
  }
}

/**
 * Returns the current storage backend type.
 * Use this to check if Pub/Sub is available (only Redis supports it).
 *
 * @returns Backend type: "redis", "postgres", or "lru"
 */
export function getStorageBackend(): "redis" | "postgres" | "lru" {
  if (!initialized) {
    getStorage();
  }
  return cacheType ?? "lru";
}

/**
 * Checks if Pub/Sub is supported by the current storage backend.
 * Currently, only Redis supports Pub/Sub.
 *
 * @returns True if Pub/Sub is available
 */
export function isPubSubSupported(): boolean {
  return getStorageBackend() === "redis";
}

/**
 * @deprecated Use getStorage() instead. Kept for backward compatibility.
 * Returns the Cache client singleton.
 *
 * This function is deprecated and provided only for backward compatibility.
 * New code should use getStorage() for the unified storage API.
 *
 * @returns Always returns null (CacheClient no longer used)
 * @deprecated Use getStorage() instead
 */
export function getCacheClient(): null | unknown {
  const storage = getStorage();
  if (storage) {
    return storage;
  }
  cacheLogger.warn("getCacheClient() is deprecated, use getStorage() instead");
  return null;
}

/**
 * @deprecated Use ensureStorageConnection() instead.
 */
export async function ensureRedisConnection(): Promise<boolean> {
  return ensureStorageConnection();
}

/**
 * @deprecated Use validateStorageConnection() instead.
 */
export async function validateRedisConnection(): Promise<boolean> {
  return validateStorageConnection();
}

/**
 * @deprecated Use getStorageStatus() instead.
 */
export async function getCacheStatus(): Promise<StorageStatus> {
  return getStorageStatus();
}

/**
 * @deprecated Use closeStorage() instead.
 */
export function closeCache(): void {
  closeStorage();
}

/**
 * Type alias for backward compatibility.
 * @deprecated Use StorageStatus instead
 */
export type CacheStatus = StorageStatus;

/**
 * @deprecated Use getStorage() instead.
 */
export function getRedisClient(): Storage | null {
  return getStorage();
}

/**
 * @deprecated Use getStorageStatus() instead.
 */
export async function getRedisStatus(): Promise<StorageStatus> {
  return getStorageStatus();
}

/**
 * @deprecated Use closeStorage() instead.
 */
export function closeRedis(): void {
  closeStorage();
}