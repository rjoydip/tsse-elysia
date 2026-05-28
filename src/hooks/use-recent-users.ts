/**
 * Hook for fetching recent users with pagination.
 * Supports infinite scrolling via loadMore() which fetches the next batch.
 * Uses a ref-based offset to prevent stale-closure races: even if a scroll
 * event fires with an old loadMore reference, offsetRef.current is always
 * up to date. loadingRef synchronously guards against concurrent fetches.
 * Tracks hasMore to stop fetching when all users are loaded.
 * Uses AbortController to cancel in-flight requests on unmount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { RecentUserItem } from "~/repositories/dashboard";
import { RECENT_USERS_COUNT } from "~/config";

/**
 * Checks whether another fetch batch should be allowed.
 */
export function shouldLoadMore(
  hasMore: boolean,
  loading: boolean,
  max: number | undefined,
  offset: number,
): boolean {
  if (!hasMore || loading) return false;
  if (max !== undefined && offset >= max) return false;
  return true;
}

/**
 * Fetches a page of recent users from the API.
 */
export async function fetchUserPage(
  limit: number,
  offset: number,
  signal: AbortSignal,
): Promise<RecentUserItem[]> {
  const response = await fetch(
    `/api/dashboard/recent-activity/users?limit=${limit}&offset=${offset}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch recent users: ${response.statusText}`);
  }
  const data = await response.json();
  return data.recentUsers ?? [];
}

/**
 * Processes the result of a fetchUserPage call.
 * Updates state, offset, and hasMore based on the fetched users.
 */
export function processPage(
  newUsers: RecentUserItem[],
  limit: number,
  signal: AbortSignal,
  loadingRef: { current: boolean },
  offsetRef: { current: number },
  setRecentUsers: (fn: (prev: RecentUserItem[]) => RecentUserItem[]) => void,
  setHasMore: (fn: boolean | ((prev: boolean) => boolean)) => void,
  setLoading: (v: boolean) => void,
): void {
  if (signal.aborted) {
    loadingRef.current = false;
    return;
  }

  setRecentUsers((prev) => [...prev, ...newUsers]);
  offsetRef.current += newUsers.length;
  if (newUsers.length < limit) {
    setHasMore(false);
  }
  setLoading(false);
  loadingRef.current = false;
}

/**
 * Handles errors from a fetchUserPage call.
 * Updates error state and resets loading flags.
 */
export function handleFetchError(
  err: unknown,
  signal: AbortSignal,
  loadingRef: { current: boolean },
  setError: (msg: string | null) => void,
  setLoading: (v: boolean) => void,
): void {
  if (signal.aborted) {
    loadingRef.current = false;
    return;
  }
  setError(err instanceof Error ? err.message : "Failed to fetch recent users");
  setLoading(false);
  loadingRef.current = false;
}

export function useRecentUsers(limit: number = RECENT_USERS_COUNT, max?: number) {
  const [recentUsers, setRecentUsers] = useState<RecentUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const aborterRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const offsetRef = useRef(0);

  const loadMore = useCallback(async () => {
    // Pure-predicate guard against cap hit, concurrent calls, or no-more-data
    if (!shouldLoadMore(hasMore, loadingRef.current, max, offsetRef.current)) {
      if (max !== undefined && offsetRef.current >= max) {
        setHasMore(false);
      }
      return;
    }
    loadingRef.current = true;

    // Cancel any previous in-flight request
    if (aborterRef.current) {
      aborterRef.current.abort();
    }
    const controller = new AbortController();
    aborterRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const newUsers = await fetchUserPage(limit, offsetRef.current, controller.signal);
      processPage(
        newUsers,
        limit,
        controller.signal,
        loadingRef,
        offsetRef,
        setRecentUsers,
        setHasMore,
        setLoading,
      );
    } catch (err) {
      handleFetchError(err, controller.signal, loadingRef, setError, setLoading);
    }
  }, [hasMore, limit, max]);

  // Load the first batch on mount
  useEffect(() => {
    const controller = new AbortController();
    aborterRef.current = controller;

    const fetchInitial = async () => {
      // Early exit if max is 0 or less — nothing to load
      if (max !== undefined && max <= 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const initialUsers = await fetchUserPage(limit, 0, controller.signal);
        if (controller.signal.aborted) return;
        setRecentUsers(initialUsers);
        offsetRef.current = initialUsers.length;
        if (initialUsers.length < limit) {
          setHasMore(false);
        }
        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch recent users");
        setLoading(false);
      }
    };

    fetchInitial();

    return () => {
      controller.abort();
      if (aborterRef.current === controller) {
        aborterRef.current = null;
      }
    };
  }, [limit, max]);

  return { recentUsers, loading, error, loadMore, hasMore };
}