/**
 * Users API endpoints.
 * Lists users from database - admin role required.
 */

import { Elysia, t } from "elysia";
import { auth } from "~/lib/auth";
import { userRepository } from "~/repositories/users";
import type { User, UserRole, UserStatus } from "~/features/users/data/schema";

/**
 * Formats user record for API response.
 * Returns null if user is null/undefined to properly handle missing data.
 */
function formatUserResponse(
  user: Awaited<ReturnType<typeof userRepository.findById>>,
): User | null {
  if (!user) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    status: (user.status ?? "active") as UserStatus,
    role: (user.role ?? "user") as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const usersExample = [
  {
    id: "usr_123",
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    email: "john@example.com",
    phoneNumber: "+1234567890",
    status: "active",
    role: "admin",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
];

export const usersRoutes = new Elysia({
  name: "api.routes.users",
  prefix: "/users",
})
  .get(
    "/",
    async ({ set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session || !session.user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const userRole = (session.user as { role?: string }).role ?? "user";
      if (!["superadmin", "admin"].includes(userRole)) {
        set.status = 403;
        return { error: "Forbidden - admin role required" };
      }

      const searchParams = new URL(request.url).searchParams;
      const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50")));
      const offset = Math.max(0, Number.parseInt(searchParams.get("offset") ?? "0"));
      const roleFilter = searchParams.get("role") as UserRole | null;
      const statusFilter = searchParams.get("status") as UserStatus | null;
      const search = searchParams.get("search") ?? undefined;

      const filters = {
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      };

      const result = await userRepository.findAll(
        Object.keys(filters).length > 0 ? filters : undefined,
        { limit, offset },
      );
      const total = await userRepository.count();

      return {
        users: result.map((u) => formatUserResponse(u)),
        pagination: {
          limit,
          offset,
          total,
        },
      };
    },
    {
      detail: {
        summary: "List users",
        description: "Returns a list of users. Requires admin or superadmin role.",
        tags: ["users"],
        responses: {
          200: {
            description: "Users retrieved successfully",
            content: { "application/json": { example: usersExample } },
          },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  .get(
    "/:id",
    async ({ set, params, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session || !session.user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const userRole = (session.user as { role?: string }).role ?? "user";
      if (!["superadmin", "admin"].includes(userRole)) {
        set.status = 403;
        return { error: "Forbidden - admin role required" };
      }

      const result = await userRepository.findById(params.id);

      if (!result) {
        set.status = 404;
        return { error: "User not found" };
      }

      return formatUserResponse(result);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get user by ID",
        description: "Returns a single user by ID. Requires admin or superadmin role.",
        tags: ["users"],
        responses: {
          200: { description: "User retrieved successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin role required" },
          404: { description: "User not found" },
        },
      },
    },
  );