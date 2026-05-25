/**
 * Dashboard service.
 * Contains business logic for dashboard data processing and transformation.
 * Uses dashboardRepository for data access.
 */

import type {
  AnalyticsOverview,
  DashboardMetrics,
  UserRoleDistribution,
  UserStatusDistribution,
  WeeklyRegistrationsItem,
  RecentUserItem,
  MonthlyRegistrationsItem,
  YearlyComparisonItem,
} from "~/repositories/dashboard";
import { dashboardRepository } from "~/repositories/dashboard";
import {
  dashboardService as realtimeDashboardService,
  DashboardResource,
} from "~/services/dashboard/main";
import { logger } from "~/lib/logger";

export class DashboardService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 30000; // 30 seconds — survives page session but resets on refresh
  private readonly MAX_CACHE_SIZE = 50;

  constructor() {
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
        // Evict oldest entry if cache exceeds max size
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
          const oldestKey = this.cache.keys().next().value;
          if (oldestKey !== undefined) {
            this.cache.delete(oldestKey);
          }
        }
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
  async getMetrics(): Promise<DashboardMetrics> {
    return this.fetchWithCache("dashboard-metrics", async () => {
      return dashboardRepository.getMetrics();
    });
  }

  /**
   * Get analytics overview.
   * Returns user counts: totalUsers, activeUsers, inactiveUsers, suspendedUsers
   */
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return this.fetchWithCache("dashboard-analytics-overview", async () => {
      const metrics = await dashboardRepository.getMetrics();
      return {
        totalUsers: metrics.totalUsers,
        activeUsers: metrics.activeUsers,
        inactiveUsers: metrics.inactiveUsers,
        suspendedUsers: metrics.suspendedUsers,
      };
    });
  }

  /**
   * Get user role distribution.
   */
  async getRoleDistribution(): Promise<UserRoleDistribution[]> {
    return this.fetchWithCache("dashboard-role-distribution", async () => {
      return dashboardRepository.getUserRoleDistribution();
    });
  }

  /**
   * Get user status distribution.
   */
  async getStatusDistribution(): Promise<UserStatusDistribution[]> {
    return this.fetchWithCache("dashboard-status-distribution", async () => {
      return dashboardRepository.getUserStatusDistribution();
    });
  }

  /**
   * Get weekly user registrations.
   */
  async getWeeklyRegistrations(): Promise<WeeklyRegistrationsItem[]> {
    return this.fetchWithCache("dashboard-weekly-registrations", async () => {
      return dashboardRepository.getWeeklyRegistrations();
    });
  }

  /**
   * Get recent users.
   */
  async getRecentUsers(limit: number = 10): Promise<RecentUserItem[]> {
    return this.fetchWithCache(`dashboard-recent-users-${limit}`, async () => {
      return dashboardRepository.getRecentUsers(limit);
    });
  }

  /**
   * Get recent activity (users).
   */
  async getRecentActivity(limit: number = 10): Promise<RecentUserItem[]> {
    return this.getRecentUsers(limit);
  }

  /**
   * Get monthly user registrations for charts.
   */
  async getMonthlyRegistrations(): Promise<MonthlyRegistrationsItem[]> {
    return this.fetchWithCache("dashboard-monthly-registrations", async () => {
      return dashboardRepository.getMonthlyRegistrations();
    });
  }

  /**
   * Get yearly comparison of user registrations.
   */
  async getYearlyRegistrationsComparison(): Promise<YearlyComparisonItem[]> {
    return this.fetchWithCache("dashboard-yearly-comparison", async () => {
      return dashboardRepository.getYearlyComparison();
    });
  }

  /**
   * Subscribe to real-time dashboard updates.
   * The real-time wiring is handled by realtimeDashboardService.subscribe().
   * The callback parameter is reserved for future use when push events from the
   * real-time service are dispatched to individual subscribers.
   *
   * @param _callback - Reserved: will dispatch updates to subscribers once listener wiring is complete
   * @param resources - Specific resources to subscribe to (optional)
   * @returns Unsubscribe function
   */
  subscribeToUpdates(
    _callback: (update: any) => void,
    resources: string[] = ["stats", "activity", "metrics"],
  ): () => void {
    // Generate a unique ID for this subscription
    const subscriptionId = Math.random().toString(36).substr(2, 9);

    // Subscribe using the real-time dashboard service
    realtimeDashboardService.subscribe(subscriptionId, resources as DashboardResource[]);

    // TODO: Connect _callback to real-time event listener so push events
    // are dispatched to individual subscribers via their stored callbacks

    // Return unsubscribe function
    return () => {
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