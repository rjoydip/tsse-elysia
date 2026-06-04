/**
 * Dynamic Permission Resolver service.
 * Resolves effective permissions for users from the database (role-based).
 * Provides caching with in-memory TTL to avoid DB hits on every check.
 * Falls back to the hardcoded ROLE_PERMISSIONS for unauthenticated/edge cases.
 */

import { userRepository } from "~/repositories/users";
import { type UserRole, getPermissions } from "~/lib/auth/permissions";

/**
 * In-memory permission cache entry.
 */
interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}

/**
 * Default cache TTL in milliseconds.
 */
const DEFAULT_CACHE_TTL = 60_000; // 1 minute

/**
 * Dynamic permission resolver that reads permissions from the database.
 * Falls back to hardcoded permissions when DB lookup fails or for unauthenticated users.
 */
export class PermissionResolver {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTtl: number;

  constructor(cacheTtl: number = DEFAULT_CACHE_TTL) {
    this.cacheTtl = cacheTtl;
  }

  /**
   * Gets all effective permissions for a user from the database.
   * Resolves permissions from all roles assigned to the user.
   * Falls back to hardcoded role-based permissions if user has no DB roles.
   *
   * @param userId - The user's ID
   * @param fallbackRole - Optional fallback role if user has no DB roles
   * @returns Array of permission strings
   */
  async getEffectivePermissions(userId: string, fallbackRole?: UserRole): Promise<string[]> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    try {
      const dbPermissions = await userRepository.getUserPermissions(userId);

      if (dbPermissions.length > 0) {
        const result = [...new Set(dbPermissions)];
        this.cache.set(userId, { permissions: result, expiresAt: Date.now() + this.cacheTtl });
        return result;
      }
    } catch {
      // DB error — fall through to fallback but do NOT cache the fallback
      if (fallbackRole) {
        return getPermissions(fallbackRole);
      }
      return [];
    }

    if (fallbackRole) {
      const result = getPermissions(fallbackRole);
      this.cache.set(userId, { permissions: result, expiresAt: Date.now() + this.cacheTtl });
      return result;
    }

    return [];
  }

  /**
   * Checks if a user has a specific permission.
   * Uses DB-based lookup with fallback to hardcoded permissions.
   *
   * @param userId - The user's ID
   * @param permission - The permission to check
   * @param fallbackRole - Optional fallback role
   * @returns True if the user has the permission
   */
  async hasPermission(
    userId: string,
    permission: string,
    fallbackRole?: UserRole,
  ): Promise<boolean> {
    const permissionsList = await this.getEffectivePermissions(userId, fallbackRole);
    return permissionsList.includes(permission);
  }

  /**
   * Checks if a user has any of the specified permissions.
   *
   * @param userId - The user's ID
   * @param permissions - Array of permissions to check (OR logic)
   * @param fallbackRole - Optional fallback role
   * @returns True if the user has at least one of the permissions
   */
  async hasAnyPermission(
    userId: string,
    permissions: string[],
    fallbackRole?: UserRole,
  ): Promise<boolean> {
    const userPerms = await this.getEffectivePermissions(userId, fallbackRole);
    return permissions.some((p) => userPerms.includes(p));
  }

  /**
   * Checks if a user has all of the specified permissions.
   *
   * @param userId - The user's ID
   * @param permissions - Array of permissions to check (AND logic)
   * @param fallbackRole - Optional fallback role
   * @returns True if the user has all of the permissions
   */
  async hasAllPermissions(
    userId: string,
    permissions: string[],
    fallbackRole?: UserRole,
  ): Promise<boolean> {
    const userPerms = await this.getEffectivePermissions(userId, fallbackRole);
    return permissions.every((p) => userPerms.includes(p));
  }

  /**
   * Clears the cache for a specific user.
   * Call this when a user's roles or permissions change.
   *
   * @param userId - The user's ID
   */
  invalidateUser(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clears the entire permission cache.
   */
  invalidateAll(): void {
    this.cache.clear();
  }
}

/**
 * Singleton instance of the permission resolver.
 */
export const permissionResolver = new PermissionResolver();