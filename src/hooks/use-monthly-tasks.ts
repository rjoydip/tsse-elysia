/**
 * Hook for fetching monthly task counts for the line chart.
 * Returns created/completed/archived counts per month for a given year.
 * Uses AbortController to cancel in-flight requests on unmount.
 */

import { useEffect, useState } from "react";

/**
 * Monthly task data point.
 */
export interface MonthlyTaskData {
  month: number;
  created: number;
  completed: number;
  archived: number;
}

/**
 * Hook that fetches monthly task data for a given year.
 */
export function useMonthlyTasks(year: number) {
  const [data, setData] = useState<MonthlyTaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchMonthly = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/tasks/monthly?year=${year}`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch monthly tasks: ${response.statusText}`);
        }
        const result = await response.json();
        if (!abortController.signal.aborted) {
          setData(result.data ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch monthly tasks");
          setLoading(false);
        }
      }
    };

    fetchMonthly();

    return () => {
      abortController.abort();
    };
  }, [year]);

  return { data, loading, error };
}