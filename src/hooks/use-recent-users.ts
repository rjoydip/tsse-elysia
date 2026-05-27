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

export function useRecentUsers(limit: number = RECENT_USERS_COUNT, max?: number) {
  const [recentUsers, setRecentUsers] = useState<RecentUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const aborterRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const offsetRef = useRef(0);

  const loadMore = useCallback(async () => {
    // Hard cap: stop if we've reached the known total
    if (max && offsetRef.current >= max) {
      setHasMore(false);
      return;
    }
    // Synchronous guard: prevents concurrent fetches even from stale closures
    if (!hasMore || loadingRef.current) return;
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
      // Use ref for offset — always current, never stale
      const response = await fetch(
        `/api/dashboard/recent-activity/users?limit=${limit}&offset=${offsetRef.current}`,
        { signal: controller.signal },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch recent users: ${response.statusText}`);
      }
      const data = await response.json();
      if (controller.signal.aborted) {
        loadingRef.current = false;
        return;
      }

      const newUsers = data.recentUsers ?? [];
      setRecentUsers((prev) => [...prev, ...newUsers]);
      offsetRef.current += newUsers.length;
      if (newUsers.length < limit) {
        setHasMore(false);
      }
      setLoading(false);
      loadingRef.current = false;
    } catch (err) {
      if (controller.signal.aborted) {
        loadingRef.current = false;
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to fetch recent users");
      setLoading(false);
      loadingRef.current = false;
    }
  }, [hasMore, limit, max]);

  // Load the first batch on mount
  useEffect(() => {
    const controller = new AbortController();
    aborterRef.current = controller;

    const fetchInitial = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/dashboard/recent-activity/users?limit=${limit}&offset=0`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error(`Failed to fetch recent users: ${response.statusText}`);
        const data = await response.json();
        if (controller.signal.aborted) return;
        const initialUsers = data.recentUsers ?? [];
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
  }, [limit]);

  return { recentUsers, loading, error, loadMore, hasMore };
}