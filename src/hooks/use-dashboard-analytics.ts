/**
 * Hook for fetching dashboard analytics data.
 * Provides loading states and error handling for user analytics data.
 * Returns: overview (user counts), roleDistribution, statusDistribution, weeklyRegistrations.
 */

import { useEffect, useState } from "react";
import { dashboardService } from "~/services/dashboard";
import type {
  AnalyticsOverview,
  UserRoleDistribution,
  UserStatusDistribution,
  WeeklyRegistrationsItem,
} from "~/repositories/dashboard";

export function useDashboardAnalytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<UserRoleDistribution[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<UserStatusDistribution[]>([]);
  const [weeklyRegistrations, setWeeklyRegistrations] = useState<WeeklyRegistrationsItem[]>([]);
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
          dashboardService.getRoleDistribution(),
          dashboardService.getStatusDistribution(),
          dashboardService.getWeeklyRegistrations(),
        ]);

        if (isMounted) {
          setOverview(overviewData);
          setRoleDistribution(roleDistData);
          setStatusDistribution(statusDistData);
          setWeeklyRegistrations(weeklyData);
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