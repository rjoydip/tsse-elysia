/**
 * Dashboard analytics API endpoints.
 * Provides user-based analytics (role distribution, status distribution, registrations) for dashboard views.
 * Uses real data from the users table via UserRepository.
 */

import { Elysia } from "elysia";
import { auth } from "~/lib/auth";
import { logger } from "~/lib/logger";
import { userRepository } from "~/repositories/users";

const analyticsExample = {
  totalUsers: 1248,
  activeUsers: 1042,
  inactiveUsers: 120,
  suspendedUsers: 86,
};

const roleDistributionExample = [
  { name: "user", value: 850 },
  { name: "admin", value: 15 },
  { name: "manager", value: 30 },
];

const statusDistributionExample = [
  { name: "active", value: 1042 },
  { name: "inactive", value: 120 },
  { name: "suspended", value: 86 },
];

const registrationsExample = [
  { name: "Mon", registrations: 12 },
  { name: "Tue", registrations: 18 },
  { name: "Wed", registrations: 8 },
  { name: "Thu", registrations: 15 },
  { name: "Fri", registrations: 22 },
  { name: "Sat", registrations: 5 },
  { name: "Sun", registrations: 3 },
];

export const analyticsRoutes = new Elysia({
  name: "api.routes.dashboard.analytics",
  prefix: "/dashboard/analytics",
})
  .get(
    "/overview",
    async ({ set, request }) => {
      // Bypass authentication in development if TEST_AUTH_BYPASS is set
      if (process.env.TEST_AUTH_BYPASS === "true") {
        // Skip session check
      } else {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          set.status = 401;
          return { error: { status: 401, message: "Unauthorized" } };
        }
      }

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
          "Failed to fetch analytics overview:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch analytics overview" };
      }
    },
    {
      detail: {
        summary: "Get analytics overview",
        description:
          "Returns user analytics including total, active, inactive, and suspended user counts.",
        tags: ["dashboard", "analytics"],
        responses: {
          200: {
            description: "Analytics overview retrieved successfully",
            content: { "application/json": { example: analyticsExample } },
          },
          401: { description: "Unauthorized - no active session" },
          500: { description: "Internal server error" },
        },
      },
    },
  )
  .get(
    "/role-distribution",
    async ({ set, request }) => {
      // Bypass authentication in development if TEST_AUTH_BYPASS is set
      if (process.env.TEST_AUTH_BYPASS !== "true") {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          set.status = 401;
          return { error: { status: 401, message: "Unauthorized" } };
        }
      }

      try {
        const roleDistribution = await userRepository.getUsersGroupedByRole();
        return {
          roleDistribution,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch role distribution:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch role distribution" };
      }
    },
    {
      detail: {
        summary: "Get user role distribution",
        description: "Returns user counts grouped by role (admin, user, manager, etc.).",
        tags: ["dashboard", "analytics"],
        responses: {
          200: {
            description: "Role distribution retrieved successfully",
            content: {
              "application/json": {
                example: roleDistributionExample,
              },
            },
          },
          401: { description: "Unauthorized - no active session" },
          500: { description: "Internal server error" },
        },
      },
    },
  )
  .get(
    "/status-distribution",
    async ({ set, request }) => {
      // Bypass authentication in development if TEST_AUTH_BYPASS is set
      if (process.env.TEST_AUTH_BYPASS !== "true") {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          set.status = 401;
          return { error: { status: 401, message: "Unauthorized" } };
        }
      }

      try {
        const statusDistribution = await userRepository.getUsersGroupedByStatus();
        return {
          statusDistribution,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch status distribution:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch status distribution" };
      }
    },
    {
      detail: {
        summary: "Get user status distribution",
        description: "Returns user counts grouped by status (active, inactive, suspended).",
        tags: ["dashboard", "analytics"],
        responses: {
          200: {
            description: "Status distribution retrieved successfully",
            content: {
              "application/json": {
                example: statusDistributionExample,
              },
            },
          },
          401: { description: "Unauthorized - no active session" },
          500: { description: "Internal server error" },
        },
      },
    },
  )
  .get(
    "/weekly-registrations",
    async ({ set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        set.status = 401;
        return { error: { status: 401, message: "Unauthorized" } };
      }

      try {
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

        const weeklyData = dayNames.map((name, index) => ({
          name,
          registrations: dayCounts.get(index) ?? 0,
        }));

        return {
          weeklyData,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch weekly registrations:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch weekly registrations" };
      }
    },
    {
      detail: {
        summary: "Get weekly user registrations",
        description: "Returns user registrations grouped by day of the current week.",
        tags: ["dashboard", "analytics"],
        responses: {
          200: {
            description: "Weekly registrations retrieved successfully",
            content: {
              "application/json": {
                example: registrationsExample,
              },
            },
          },
          401: { description: "Unauthorized - no active session" },
          500: { description: "Internal server error" },
        },
      },
    },
  );