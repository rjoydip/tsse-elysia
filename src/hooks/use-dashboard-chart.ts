/**
 * Hook for fetching dashboard chart data.
 * Provides loading states and error handling for monthly user registration chart data.
 *
 * Uses AbortController to cancel in-flight requests on unmount,
 * preventing duplicate requests under React StrictMode.
 */

import { useEffect, useState } from "react";
import type { MonthlyRegistrationsItem, YearlyComparisonItem } from "~/repositories/dashboard";

/**
 * Filters data to only include months up to the current month.
 * Serves as a client-side safety net even if the backend returns future months.
 */
export function capToCurrentMonth<T extends { name: string }>(data: T[]): T[] {
  const currentMonth = new Date().getMonth();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return data.filter((item) => {
    const monthIndex = monthNames.indexOf(item.name);
    return monthIndex >= 0 && monthIndex <= currentMonth;
  });
}

export function useDashboardChartData() {
  const [monthlyData, setMonthlyData] = useState<MonthlyRegistrationsItem[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [monthlyRes, yearlyRes] = await Promise.all([
          fetch("/api/dashboard/overview-chart/monthly-sales", {
            signal: abortController.signal,
          }),
          fetch("/api/dashboard/overview-chart/yearly-comparison", {
            signal: abortController.signal,
          }),
        ]);

        if (abortController.signal.aborted) return;

        if (!monthlyRes.ok || !yearlyRes.ok) {
          throw new Error("Failed to fetch chart data");
        }

        const [monthlyJson, yearlyJson] = await Promise.all([monthlyRes.json(), yearlyRes.json()]);

        if (!abortController.signal.aborted) {
          // Client-side safety net: cap to current month regardless of backend
          setMonthlyData(capToCurrentMonth(monthlyJson.monthlyData ?? []));
          setYearlyData(capToCurrentMonth(yearlyJson.yearlyData ?? []));
          setLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard chart data");
          setLoading(false);
        }
      }
    };

    fetchChartData();

    return () => {
      abortController.abort();
    };
  }, []);

  return { monthlyData, yearlyData, loading, error };
}