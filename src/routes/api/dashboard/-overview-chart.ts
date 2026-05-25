/**
 * Dashboard overview chart API endpoints.
 * Provides monthly user registration data for dashboard chart views.
 * Uses real data from the users table via UserRepository.
 */

import { Elysia } from "elysia";
import { logger } from "~/lib/logger";
import { userRepository } from "~/repositories/users";
import { validateAuthenticated } from "~/lib/dashboard/auth-utils";

const monthlyRegistrationsExample = [
  { name: "Jan", total: 32 },
  { name: "Feb", total: 28 },
  { name: "Mar", total: 45 },
];

const yearlyComparisonExample = [
  { name: "Jan", currentYear: 32, previousYear: 25 },
  { name: "Feb", currentYear: 28, previousYear: 22 },
  { name: "Mar", currentYear: 45, previousYear: 38 },
];

export const overviewChartRoutes = new Elysia({
  name: "api.routes.dashboard.overview-chart",
  prefix: "/dashboard/overview-chart",
})
  .get(
    "/monthly-sales",
    async ({ set, request }) => {
      const authResult = await validateAuthenticated(request, set);
      if (authResult.error) return { error: authResult.error.message };

      try {
        const monthlyData = await userRepository.getMonthlyRegistrations();
        return {
          monthlyData,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch monthly registrations:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch monthly registrations" };
      }
    },
    {
      detail: {
        summary: "Get monthly user registrations",
        description: "Returns monthly user registration counts for the current year.",
        tags: ["dashboard", "chart"],
        responses: {
          200: {
            description: "Monthly registrations retrieved successfully",
            content: {
              "application/json": {
                example: monthlyRegistrationsExample,
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
    "/yearly-comparison",
    async ({ set, request }) => {
      const authResult = await validateAuthenticated(request, set);
      if (authResult.error) return { error: authResult.error.message };

      try {
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

        const currentYearData = await userRepository.getMonthlyRegistrations();

        const yearlyData = monthNames.map((name, index) => ({
          name,
          currentYear: currentYearData[index]?.total ?? 0,
          previousYear: 0,
        }));

        return {
          yearlyData,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch yearly comparison:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch yearly comparison" };
      }
    },
    {
      detail: {
        summary: "Get yearly user registration comparison",
        description:
          "Returns monthly user registration counts comparing current year to previous year.",
        tags: ["dashboard", "chart"],
        responses: {
          200: {
            description: "Yearly comparison retrieved successfully",
            content: {
              "application/json": {
                example: yearlyComparisonExample,
              },
            },
          },
          401: { description: "Unauthorized - no active session" },
          500: { description: "Internal server error" },
        },
      },
    },
  );