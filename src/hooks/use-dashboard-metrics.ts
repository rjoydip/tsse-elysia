/**
 * Hook for fetching dashboard metrics.
 * Provides loading states and error handling for dashboard data.
 * Returns user metrics: totalUsers, activeUsers, inactiveUsers, suspendedUsers, userGrowth.
 */

import { useEffect, useState } from "react";
import { dashboardService } from "~/services/dashboard";
import type { DashboardMetrics } from "~/repositories/dashboard";

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getMetrics();
        if (isMounted) {
          // data is the full response from /api/dashboard/metrics
          setMetrics(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard metrics");
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return { metrics, loading, error };
}