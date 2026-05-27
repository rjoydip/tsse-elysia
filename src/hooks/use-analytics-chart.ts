/**
 * Hook for preparing analytics chart data from weekly registrations.
 * Transforms raw weekly registrations into chart data points.
 * Uses AbortController to cancel in-flight requests on unmount.
 *
 * @deprecated Use `useDashboardAnalytics` instead and pass `weeklyRegistrations`
 * to `AnalyticsChart` as a prop to avoid duplicate fetches.
 */

import { useEffect, useState } from "react";
import type { WeeklyRegistrationsItem } from "~/repositories/dashboard";

export interface ChartDataPoint {
  name: string;
  clicks: number;
  uniques: number;
}

/**
 * Maps raw weekly registration data to chart-compatible format.
 */
export function mapWeeklyToChartData(weeklyData: WeeklyRegistrationsItem[]): ChartDataPoint[] {
  return weeklyData.map((item) => ({
    name: item.name,
    clicks: item.registrations,
    uniques: item.registrations,
  }));
}

/**
 * Transforms weekly registrations into chart data points.
 * Accepts data directly (preferred) or falls back to fetching.
 */
export function useAnalyticsChartData(weeklyRegistrations?: WeeklyRegistrationsItem[]) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (weeklyRegistrations) {
      setChartData(mapWeeklyToChartData(weeklyRegistrations));
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard/analytics/weekly-registrations", {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.statusText}`);
        }
        const data = await response.json();

        if (!abortController.signal.aborted) {
          const weeklyData = (data.weeklyData ?? []) as WeeklyRegistrationsItem[];
          setChartData(mapWeeklyToChartData(weeklyData));
          setLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch analytics chart data");
          setLoading(false);
        }
      }
    };

    fetchChartData();

    return () => {
      abortController.abort();
    };
  }, [weeklyRegistrations]);

  return { chartData, loading, error };
}