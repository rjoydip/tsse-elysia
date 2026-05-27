/**
 * Hook for fetching dashboard metrics.
 * Provides loading states and error handling for dashboard data.
 * Returns user metrics: totalUsers, activeUsers, inactiveUsers, suspendedUsers, userGrowth.
 *
 * Uses AbortController to cancel in-flight requests on unmount,
 * preventing duplicate requests under React StrictMode.
 */

import { useEffect, useState } from "react";
import type { DashboardMetrics } from "~/repositories/dashboard";

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/dashboard/metrics", {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard metrics: ${response.statusText}`);
        }
        const data = await response.json();
        if (!abortController.signal.aborted) {
          setMetrics(data);
          setLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard metrics");
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      abortController.abort();
    };
  }, []);

  return { metrics, loading, error };
}