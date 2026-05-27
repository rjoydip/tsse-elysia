/**
 * Hook for fetching dashboard analytics data.
 * Provides loading states and error handling for user analytics data.
 * Returns: overview (user counts), roleDistribution, statusDistribution, weeklyRegistrations.
 *
 * Uses AbortController to cancel in-flight requests on unmount,
 * preventing duplicate requests under React StrictMode.
 */

import { useEffect, useState } from "react";
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
    const abortController = new AbortController();

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [overviewRes, roleRes, statusRes, weeklyRes] = await Promise.all([
          fetch("/api/dashboard/analytics/overview", { signal: abortController.signal }),
          fetch("/api/dashboard/analytics/role-distribution", { signal: abortController.signal }),
          fetch("/api/dashboard/analytics/status-distribution", { signal: abortController.signal }),
          fetch("/api/dashboard/analytics/weekly-registrations", {
            signal: abortController.signal,
          }),
        ]);

        if (abortController.signal.aborted) return;

        if (!overviewRes.ok || !roleRes.ok || !statusRes.ok || !weeklyRes.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const [overviewData, roleData, statusData, weeklyData] = await Promise.all([
          overviewRes.json(),
          roleRes.json(),
          statusRes.json(),
          weeklyRes.json(),
        ]);

        if (!abortController.signal.aborted) {
          setOverview(overviewData);
          setRoleDistribution(roleData.roleDistribution ?? []);
          setStatusDistribution(statusData.statusDistribution ?? []);
          setWeeklyRegistrations(weeklyData.weeklyData ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard analytics");
          setLoading(false);
        }
      }
    };

    fetchAnalyticsData();

    return () => {
      abortController.abort();
    };
  }, []);

  return { overview, roleDistribution, statusDistribution, weeklyRegistrations, loading, error };
}