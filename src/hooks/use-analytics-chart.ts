/**
 * Hook for fetching analytics chart data.
 * Provides loading states and error handling for weekly user registration chart data.
 */

import { useEffect, useState } from "react";
import { dashboardService } from "~/services/dashboard";

export function useAnalyticsChartData() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch weekly registrations data
        const weeklyData = await dashboardService.getTrafficOverTime();

        if (isMounted) {
          // Map the weekly data to the format expected by the chart
          const mappedData = (weeklyData?.weeklyData ?? []).map((item: any) => ({
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