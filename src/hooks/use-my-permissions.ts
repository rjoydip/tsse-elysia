/**
 * Hook for fetching the current user's effective permissions from the database.
 * Fetches from GET /api/roles/permissions/mine and caches the result in sessionStorage.
 * Falls back to hardcoded role-based permissions when the API is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Permission } from "~/lib/auth/permissions";
import { usePermission } from "./use-permission";

/** Cache duration in milliseconds (5 minutes). */
const CACHE_TTL = 5 * 60 * 1000;

/** Session storage key for caching permissions. */
const STORAGE_KEY = "tsse-permissions";

/**
 * Return type for useMyPermissions hook.
 */
export interface UseMyPermissionsReturn {
  /** All effective permissions (from DB or fallback). */
  permissions: Permission[];
  /** Whether the fetch is in progress. */
  isPending: boolean;
  /** Error message if fetch failed. */
  error: string | null;
  /** Check if the user has a specific permission. */
  can: (permission: Permission) => boolean;
  /** Refetch permissions from the server. */
  refetch: () => Promise<void>;
}

/**
 * Reads cached permissions from session storage.
 */
function readCache(): { permissions: string[]; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { permissions: string[]; timestamp: number };
  } catch {
    return null;
  }
}

/**
 * Writes permissions to session storage cache.
 */
function writeCache(permissions: string[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ permissions, timestamp: Date.now() }));
  } catch {
    // Storage full or unavailable — silently skip caching
  }
}

/**
 * Checks if a cache entry is still valid.
 */
function isCacheValid(cache: { permissions: string[]; timestamp: number }): boolean {
  return Date.now() - cache.timestamp < CACHE_TTL;
}

/**
 * Hook that fetches the current user's effective permissions from the database.
 *
 * Returns a `can()` function that checks permissions dynamically (from DB),
 * plus the full list of permissions. Falls back to hardcoded role-based
 * permissions (via `usePermission`) if the API call fails.
 *
 * Results are cached in sessionStorage for 5 minutes to avoid redundant
 * API calls on every navigation.
 *
 * @example
 * const { can, permissions, isPending } = useMyPermissions();
 * if (can('dashboard:analytics')) {
 *   return <AnalyticsPanel />;
 * }
 */
export function useMyPermissions(): UseMyPermissionsReturn {
  const { permissions: fallbackPermissions } = usePermission();
  const [permissions, setPermissions] = useState<Permission[]>(() => {
    // Try cache on initial mount
    const cached = readCache();
    if (cached && isCacheValid(cached)) {
      return cached.permissions as Permission[];
    }
    return fallbackPermissions;
  });
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const can = useCallback(
    (permission: Permission): boolean => permissions.includes(permission),
    [permissions],
  );

  const fetchPermissions = useCallback(async () => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/roles/permissions/mine");
      if (!response.ok) {
        throw new Error(`Failed to fetch permissions: ${response.status}`);
      }
      const data = (await response.json()) as { permissions: string[] };
      const perms = data.permissions as Permission[];
      setPermissions(perms);
      writeCache(perms);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      // Fall back to hardcoded permissions
      setPermissions(fallbackPermissions);
    } finally {
      setIsPending(false);
    }
  }, [fallbackPermissions]);

  // Fetch on mount once
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchPermissions();
  }, [fetchPermissions]);

  return { permissions, isPending, error, can, refetch: fetchPermissions };
}