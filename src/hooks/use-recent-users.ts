/**
 * Hook for fetching recent users.
 * Provides loading states and error handling for recent user data.
 *
 * Uses AbortController to cancel in-flight requests on unmount,
 * preventing duplicate requests under React StrictMode.
 */

import { useEffect, useState } from "react";
import type { RecentUserItem } from "~/repositories/dashboard";

export function useRecentUsers(limit: number = 5) {
  const [recentUsers, setRecentUsers] = useState<RecentUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchRecentUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/dashboard/recent-activity/users?limit=${limit}`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch recent users: ${response.statusText}`);
        }
        const data = await response.json();
        if (!abortController.signal.aborted) {
          setRecentUsers(data.recentUsers ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch recent users");
          setLoading(false);
        }
      }
    };

    fetchRecentUsers();

    return () => {
      abortController.abort();
    };
  }, [limit]);

  return { recentUsers, loading, error };
}