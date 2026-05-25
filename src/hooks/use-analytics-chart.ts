/**
 * Hook for fetching analytics chart data.
 * Provides loading states and error handling for weekly user registration chart data.
 */

import { useEffect, useState } from "react";
import { dashboardService } from "~/services/dashboard";
import type { WeeklyRegistrationsItem } from "~/repositories/dashboard";

interface ChartDataPoint {
  name: string;
  clicks: number;
  uniques: number;
}

export function useAnalyticsChartData() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch weekly registrations data
        const weeklyData = await dashboardService.getWeeklyRegistrations();

        if (isMounted) {
          // Map the weekly data to the format expected by the chart
          const mappedData = (weeklyData ?? []).map((item: WeeklyRegistrationsItem) => ({
            name: item.name,
            clicks: item.registrations,
            uniques: item.registrations,
          }));

          setChartData(mappedData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch analytics chart data");
          setLoading(false);
        }
      }
    };

    fetchChartData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return { chartData, loading, error };
}