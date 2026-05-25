/**
 * Hook for fetching dashboard analytics data.
 * Provides loading states and error handling for user analytics data.
 * Returns: overview (user counts), roleDistribution, statusDistribution, weeklyRegistrations.
 */

import { useEffect, useState } from "react";
import { dashboardService } from "~/services/dashboard";

export function useDashboardAnalytics() {
  const [overview, setOverview] = useState<any>(null);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [weeklyRegistrations, setWeeklyRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all analytics data in parallel
        const [overviewData, roleDistData, statusDistData, weeklyData] = await Promise.all([
          dashboardService.getAnalyticsOverview(),
          dashboardService.getReferrers(),
          dashboardService.getDevices(),
          dashboardService.getTrafficOverTime(),
        ]);

        if (isMounted) {
          setOverview(overviewData);
          setRoleDistribution(roleDistData?.roleDistribution ?? []);
          setStatusDistribution(statusDistData?.statusDistribution ?? []);
          setWeeklyRegistrations(weeklyData?.weeklyData ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard analytics");
          setLoading(false);
        }
      }
    };

    fetchAnalyticsData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return { overview, roleDistribution, statusDistribution, weeklyRegistrations, loading, error };
}