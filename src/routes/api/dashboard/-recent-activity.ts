/**
 * Dashboard recent activity API endpoints.
 * Provides feed of recently registered users for dashboard views.
 * Uses real data from the users table via UserRepository.
 */

import { Elysia } from "elysia";
import { logger } from "~/lib/logger";
import { userRepository } from "~/repositories/users";
import { validateAuthenticated } from "~/lib/dashboard/auth-utils";

function formatUserForDisplay(user: Awaited<ReturnType<typeof userRepository.findRecent>>[0]) {
  const displayName =
    user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
  const nameParts = displayName.split(" ");
  const fallback =
    nameParts.length >= 2
      ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
      : displayName.charAt(0);

  return {
    id: user.id,
    avatarSrc: user.image ?? `/avatars/01.png`,
    fallback: fallback.toUpperCase(),
    name: displayName,
    email: user.email,
    role: user.role ?? "user",
    timestamp: user.createdAt instanceof Date ? user.createdAt.getTime() : Number(user.createdAt),
  };
}

const recentUsersExample = [
  {
    id: "user_001",
    avatarSrc: "/avatars/01.png",
    fallback: "JD",
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    timestamp: Date.now() - 300000,
  },
];

export const recentActivityRoutes = new Elysia({
  name: "api.routes.dashboard.recent-activity",
  prefix: "/dashboard/recent-activity",
})
  .get(
    "/sales",
    async ({ set, request }) => {
      const authResult = await validateAuthenticated(request, set);
      if (authResult.error) return { error: authResult.error.message };

      try {
        const limit = Math.min(
          50,
          Math.max(1, Number.parseInt(new URL(request.url).searchParams.get("limit") ?? "10")),
        );
        // Only show users with the "user" role (exclude admins, managers, etc.)
        const dbUsers = await userRepository.findRecent(limit, "user");

        // Format recent users using the shared display helper
        return {
          recentUsers: dbUsers.map((user) => {
            const formatted = formatUserForDisplay(user);
            return { ...formatted, amount: formatted.role };
          }),
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch recent users:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch recent users" };
      }
    },
    {
      detail: {
        summary: "Get recent users",
        description:
          "Returns a feed of recently registered users (replaces recent sales with user data).",
        tags: ["dashboard", "activity"],
        responses: {
          200: {
            description: "Recent users retrieved successfully",
            content: {
              "application/json": {
                example: recentUsersExample,
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
    "/users",
    async ({ set, request }) => {
      const authResult = await validateAuthenticated(request, set);
      if (authResult.error) return { error: authResult.error.message };

      try {
        const url = new URL(request.url);
        const limit = Math.min(
          50,
          Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "10")),
        );
        const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") ?? "0"));
        // Only show users with the "user" role (exclude admins, managers, etc.)
        const recentUsers = await userRepository.findRecent(limit, "user", offset);

        return {
          recentUsers: recentUsers.map(formatUserForDisplay),
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(
          "Failed to fetch recent users:",
          error instanceof Error ? error : new Error(String(error)),
        );
        set.status = 500;
        return { error: "Failed to fetch recent users" };
      }
    },
    {
      detail: {
        summary: "Get recent users",
        description:
          "Returns a feed of recently registered users with role info. Supports pagination via limit and offset.",
        tags: ["dashboard", "activity"],
        responses: {
          200: {
            description: "Recent users retrieved successfully",
            content: {
              "application/json": {
                example: recentUsersExample,
              },
            },
          },
          401: { description: "Unauthorized - no active session" },
          500: { description: "Internal server error" },
        },
      },
    },
  );