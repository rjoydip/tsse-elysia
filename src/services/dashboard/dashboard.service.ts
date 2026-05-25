/**
 * Dashboard service.
 * Contains business logic for dashboard data processing and transformation.
 * Fetches user-based data from the dashboard API endpoints.
 */

import {
  dashboardService as realtimeDashboardService,
  DashboardResource,
} from "~/services/dashboard/main";
import { logger } from "~/lib/logger";

// Define types as any for now since we are fetching from API and not using repository
export type DashboardMetrics = any;
export type AnalyticsOverview = any;
export type UserRoleDistribution = any;
export type UserStatusDistribution = any;
export type WeeklyRegistrationsItem = any;
export type RecentUserItem = any;
export type MonthlyRegistrationsItem = any;
export type YearlyComparisonItem = any;

export class DashboardService {
  private subscriptions: Map<string, (update: any) => void> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5000; // 5 seconds

  constructor() {
    // No repository needed
    logger.debug("Dashboard service initialized");
  }

  /**
   * Fetch data with caching to reduce API calls
   * @param key - Cache key
   * @param fetchFn - Function that returns the data to cache
   * @param ttlMs - Time to live in milliseconds (default: 5 seconds)
   * @returns Cached or freshly fetched data
   */
  private fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs = this.CACHE_TTL_MS,
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttlMs) {
      logger.debug(`Dashboard service cache hit for key: ${key}`);
      return Promise.resolve(cached.data);
    }

    logger.debug(`Dashboard service cache miss for key: ${key}`);
    return fetchFn()
      .then((data) => {
        this.cache.set(key, { data, timestamp: now });
        return data;
      })
      .catch((error) => {
        logger.error(`Dashboard service fetch error for key: ${key}`, error);
        throw error;
      });
  }

  /**
   * Get all dashboard metrics with caching.
   * Returns user metrics: totalUsers, activeUsers, inactiveUsers, suspendedUsers, userGrowth
   */
  async getMetrics(): Promise<any> {
    return this.fetchWithCache("/api/dashboard/metrics", async () => {
      const res = await fetch(`/api/dashboard/metrics`);
      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard metrics: ${res.status}`);
      }
      return res.json();
    });
  }

  /**
   * Get analytics overview.
   * Returns user counts: totalUsers, activeUsers, inactiveUsers, suspendedUsers
   */
  async getAnalyticsOverview(): Promise<any> {
    return this.fetchWithCache("/api/dashboard/analytics/overview", async () => {
      const res = await fetch(`/api/dashboard/analytics/overview`);
      if (!res.ok) {
        throw new Error(`Failed to fetch analytics overview: ${res.status}`);
      }
      return res.json();
    });
  }

  /**
   * Get user role distribution.
   */
  async getReferrers(): Promise<any> {
    return this.fetchWithCache("/api/dashboard/analytics/role-distribution", async () => {
      const res = await fetch(`/api/dashboard/analytics/role-distribution`);
      if (!res.ok) {
        throw new Error(`Failed to fetch role distribution: ${res.status}`);
      }
      return res.json();
    });
  }

  /**
   * Get user status distribution.
   */
  async getDevices(): Promise<any> {
    return this.fetchWithCache("/api/dashboard/analytics/status-distribution", async () => {
      const res = await fetch(`/api/dashboard/analytics/status-distribution`);
      if (!res.ok) {
        throw new Error(`Failed to fetch status distribution: ${res.status}`);
      }
      return res.json();
    });
  }

  /**
   * Get weekly user registrations.
   */
  async getTrafficOverTime(): Promise<any> {
    return this.fetchWithCache("/api/dashboard/analytics/weekly-registrations", async () => {
      const res = await fetch(`/api/dashboard/analytics/weekly-registrations`);
      if (!res.ok) {
        throw new Error(`Failed to fetch weekly registrations: ${res.status}`);
      }
      return res.json();
    });
  }

  /**
   * Get recent users.
   */
  async getRecentUsers(limit: number = 10): Promise<any> {
    return this.fetchWithCache(`/api/dashboard/recent-activity/users?limit=${limit}`, async () => {
      const res = await fetch(`/api/dashboard/recent-activity/users?limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch recent users: ${res.status}`);
      }
      return res.json();
    });
  }

  /**
   * Get recent activity (users).
   */
  async getRecentActivity(limit: number = 10) {
    return this.getRecentUsers(limit);
  }

  /**
   * Get monthly user registrations for charts.
   */
  async getMonthlySalesData(): Promise<any> {
    const res = await fetch(`/api/dashboard/overview-chart/monthly-sales`);
    if (!res.ok) {
      throw new Error(`Failed to fetch monthly registrations: ${res.status}`);
    }
    return res.json();
  }

  /**
   * Get yearly comparison of user registrations.
   */
  async getYearlyComparison(): Promise<any> {
    const res = await fetch(`/api/dashboard/overview-chart/yearly-comparison`);
    if (!res.ok) {
      throw new Error(`Failed to fetch yearly comparison: ${res.status}`);
    }
    return res.json();
  }

  /**
   * Subscribe to real-time dashboard updates
   * @param callback - Function to call when dashboard data updates
   * @param resources - Specific resources to subscribe to (optional)
   * @returns Unsubscribe function
   */
  subscribeToUpdates(
    callback: (update: any) => void,
    resources: string[] = ["stats", "activity", "metrics"],
  ): () => void {
    // Generate a unique ID for this subscription
    const subscriptionId = Math.random().toString(36).substr(2, 9);

    // Create a wrapper callback that handles the update
    const handleUpdate = (update: any) => {
      // Only call the callback if the update is for a subscribed resource
      if (!update.resource || resources.includes(update.resource)) {
        callback(update);
      }
    };

    // Subscribe using the real-time dashboard service
    realtimeDashboardService.subscribe(subscriptionId, resources as DashboardResource[]);

    // In a real implementation, we would set up a listener here
    // For now, we'll simulate by storing the callback and returning an unsubscribe function
    this.subscriptions.set(subscriptionId, handleUpdate);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(subscriptionId);
      realtimeDashboardService.unsubscribe(subscriptionId, resources as any[]);
    };
  }

  /**
   * Send optimistic update to user (for UI actions)
   * @param userId - User ID to send update to
   * @param update - Dashboard update to send optimistically
   */
  sendOptimisticUpdate(userId: string, update: any) {
    realtimeDashboardService.sendOptimistic(userId, {
      resource: update.resource || "metrics",
      action: update.action || "update",
      data: update.data,
      timestamp: Date.now(),
    });
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();