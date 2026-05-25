/**
 * Hook for fetching dashboard chart data.
 * Provides loading states and error handling for monthly user registration chart data.
 */

import { useEffect, useState } from "react";
import { dashboardService } from "~/services/dashboard";
import type { MonthlyRegistrationsItem, YearlyComparisonItem } from "~/repositories/dashboard";

export function useDashboardChartData() {
  const [monthlyData, setMonthlyData] = useState<MonthlyRegistrationsItem[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both datasets in parallel
        const [monthly, yearly] = await Promise.all([
          dashboardService.getMonthlyRegistrations(),
          dashboardService.getYearlyRegistrationsComparison(),
        ]);

        if (isMounted) {
          setMonthlyData(monthly);
          setYearlyData(yearly);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard chart data");
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

  return { monthlyData, yearlyData, loading, error };
}