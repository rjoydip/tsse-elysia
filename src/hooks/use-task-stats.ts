/**
 * Hook for fetching task statistics for the user dashboard.
 * Provides aggregate counts: total, active, archived, deleted, and by status.
 * Uses AbortController to cancel in-flight requests on unmount.
 */

import { useEffect, useState } from "react";

/**
 * Task stats shape returned by the API.
 */
export interface TaskStats {
  total: number;
  active: number;
  archived: number;
  deleted: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  backlog: number;
  canceled: number;
}

/**
 * Hook that fetches task stats from the API.
 */
export function useTaskStats() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/tasks/stats", {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch task stats: ${response.statusText}`);
        }
        const data = await response.json();
        if (!abortController.signal.aborted) {
          setStats(data);
          setLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch task stats");
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      abortController.abort();
    };
  }, []);

  return { stats, loading, error };
}