/**
 * Dashboard repository.
 * Handles data access for dashboard-related entities and metrics.
 * Uses real user data from the database via UserRepository.
 */

import { userRepository } from "~/repositories/users";

// Types for dashboard data
export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  userGrowth: number;
  timestamp: number;
}

export interface UserRoleDistribution {
  name: string;
  value: number;
}

export interface UserStatusDistribution {
  name: string;
  value: number;
}

export interface WeeklyRegistrationsItem {
  name: string;
  registrations: number;
}

export interface RecentUserItem {
  id: string;
  avatarSrc: string;
  fallback: string;
  name: string;
  email: string;
  role: string;
  timestamp: number;
}

export interface MonthlyRegistrationsItem {
  name: string;
  total: number;
}

export interface YearlyComparisonItem {
  name: string;
  currentYear: number;
  previousYear: number;
}

export class DashboardRepository {
  /**
   * Get all dashboard metrics using real user data.
   */
  async getMetrics(): Promise<DashboardMetrics> {
    const [totalUsers, activeUsers, inactiveUsers, suspendedUsers] = await Promise.all([
      userRepository.count(),
      userRepository.countByStatus("active"),
      userRepository.countByStatus("inactive"),
      userRepository.countByStatus("suspended"),
    ]);

    // Calculate user growth: percentage of active users vs total
    const userGrowth = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      userGrowth,
      timestamp: Date.now(),
    };
  }

  /**
   * Get user role distribution (replaces referrers).
   */
  async getUserRoleDistribution(): Promise<UserRoleDistribution[]> {
    const rows = await userRepository.getUsersGroupedByRole();
    return rows.sort((a, b) => b.value - a.value);
  }

  /**
   * Get user status distribution.
   */
  async getUserStatusDistribution(): Promise<UserStatusDistribution[]> {
    return userRepository.getUsersGroupedByStatus();
  }

  /**
   * Get weekly user registrations (replaces traffic over time).
   */
  async getWeeklyRegistrations(): Promise<WeeklyRegistrationsItem[]> {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const weekAgo = now - oneWeek;

    const recentUsers = await userRepository.findRecent(100);

    // Count registrations per day of week
    const dayCounts = new Map<number, number>();
    for (const user of recentUsers) {
      const createdAt =
        user.createdAt instanceof Date ? user.createdAt.getTime() : Number(user.createdAt);
      if (createdAt >= weekAgo) {
        const day = new Date(createdAt).getDay(); // 0=Sun, 1=Mon, ...
        // Convert to Mon=0 .. Sun=6
        const adjustedDay = day === 0 ? 6 : day - 1;
        dayCounts.set(adjustedDay, (dayCounts.get(adjustedDay) ?? 0) + 1);
      }
    }

    return dayNames.map((name, index) => ({
      name,
      registrations: dayCounts.get(index) ?? 0,
    }));
  }

  /**
   * Get recent users (replaces recent sales).
   */
  async getRecentUsers(limit: number = 10): Promise<RecentUserItem[]> {
    const recentUsers = await userRepository.findRecent(limit);

    return recentUsers.map((user) => {
      const displayName =
        user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
      const [firstName, lastName] = displayName.split(" ");
      const fallback =
        firstName && lastName
          ? `${firstName.charAt(0)}${lastName.charAt(0)}`
          : displayName.charAt(0);

      return {
        id: user.id,
        avatarSrc: user.image ?? `/avatars/01.png`,
        fallback: fallback.toUpperCase(),
        name: displayName,
        email: user.email,
        role: user.role ?? "user",
        timestamp:
          user.createdAt instanceof Date ? user.createdAt.getTime() : Number(user.createdAt),
      };
    });
  }

  /**
   * Get monthly user registrations for charts (replaces monthly sales).
   */
  async getMonthlyRegistrations(): Promise<MonthlyRegistrationsItem[]> {
    return userRepository.getMonthlyRegistrations();
  }

  /**
   * Get yearly comparison (monthly registrations this year vs last year).
   */
  async getYearlyComparison(): Promise<YearlyComparisonItem[]> {
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

    // For simplicity, use monthly registrations for current year
    const currentYearData = await userRepository.getMonthlyRegistrations();

    // For previous year, we'd need a similar query filtered by date range
    // For now, return current year data and an empty previous year
    return monthNames.map((name, index) => ({
      name,
      currentYear: currentYearData[index]?.total ?? 0,
      previousYear: 0, // Previous year data not available without a date-filtered query
    }));
  }
}

// Export singleton instance
export const dashboardRepository = new DashboardRepository();