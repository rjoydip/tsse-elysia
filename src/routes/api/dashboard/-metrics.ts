/**
 * Dashboard metrics API endpoints.
 * Provides user metrics (total, active, inactive, suspended) for dashboard views.
 * Uses real data from the users table via UserRepository.
 */

import { Elysia } from "elysia";
import { logger } from "~/lib/logger";
import { userRepository } from "~/repositories/users";
import { validateAuthenticated } from "~/lib/dashboard/auth-utils";

const metricsExample = {
  totalUsers: 1248,
  activeUsers: 1042,
  inactiveUsers: 120,
  suspendedUsers: 86,
  usersThisMonth: 265,
  userGrowth: 83.5,
};

export const metricsRoutes = new Elysia({
  name: "api.routes.dashboard.metrics",
  prefix: "/dashboard/metrics",
})
  .get(
    "/",
    async ({ set, request }) => {
      const authResult = await validateAuthenticated(request, set);
      if (authResult.error) return { error: authResult.error.message };

      try {
        const [
          totalUsers,
          activeUsers,
          inactiveUsers,
          suspendedUsers,
          usersThisMonth,
          activeNowCount,
        ] = await Promise.all([
          userRepository.count(),
          userRepository.countByStatus("active"),
          userRepository.countByStatus("inactive"),
          userRepository.countByStatus("suspended"),
          userRepository.countUsersThisMonth(),
          userRepository.countUsersUpdatedLastHour(),
        ]);

        const userGrowth =
          totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100 * 10) / 10 : 0;

        return {
          totalUsers,
          activeUsers,
          inactiveUsers,
          suspendedUsers,
          usersThisMonth,
          userGrowth,
          activeNow: activeNowCount,
          activeNowGrowth: 0,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch dashboard metrics:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch dashboard metrics" };
      }
    },
    {
      detail: {
        summary: "Get dashboard metrics",
        description:
          "Returns key user metrics for dashboard including total, active, inactive, and suspended user counts.",
        tags: ["dashboard"],
        responses: {
          200: {
            description: "Dashboard metrics retrieved successfully",
            content: { "application/json": { example: metricsExample } },
          },
          401: { description: "Unauthorized - no active session" },
          500: { description: "Internal server error" },
        },
      },
    },
  )
  .get(
    "/users",
    async ({ set, request }) => {
      const authResult = await validateAuthenticated(request, set);
      if (authResult.error) return { error: authResult.error.message };

      try {
        const [totalUsers, activeUsers, inactiveUsers, suspendedUsers] = await Promise.all([
          userRepository.count(),
          userRepository.countByStatus("active"),
          userRepository.countByStatus("inactive"),
          userRepository.countByStatus("suspended"),
        ]);

        return {
          totalUsers,
          activeUsers,
          inactiveUsers,
          suspendedUsers,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch user metrics:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch user metrics" };
      }
    },
    {
      detail: {
        summary: "Get user metrics",
        description: "Returns total, active, inactive, and suspended user counts.",
        tags: ["dashboard"],
        responses: {
          200: {
            description: "User metrics retrieved successfully",
            content: {
              "application/json": {
                example: {
                  totalUsers: 1248,
                  activeUsers: 1042,
                  inactiveUsers: 120,
                  suspendedUsers: 86,
                },
              },
            },
          },
          401: { description: "Unauthorized - no active session" },
          500: { description: "Internal server error" },
        },
      },
    },
  );