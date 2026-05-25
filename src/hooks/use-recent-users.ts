/**
 * Hook for fetching recent users.
 * Provides loading states and error handling for recent user data.
 */

import { useEffect, useState } from "react";
import { dashboardService } from "~/services/dashboard";

export function useRecentUsers(limit: number = 5) {
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRecentUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getRecentUsers(limit);
        if (isMounted) {
          setRecentUsers(data?.recentUsers ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch recent users");
          setLoading(false);
        }
      }
    };

    fetchRecentUsers();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { recentUsers, loading, error };
}