/**
 * Users API endpoints.
 * Lists users from database - admin role required.
 */

import { Elysia, t } from "elysia";
import { auth } from "~/lib/auth";
import { userRepository } from "~/repositories/users";
import { env } from "~/config/env";
import type { User, UserRole, UserStatus } from "~/features/users/data/schema";

const VALID_ROLES = ["user", "cashier", "manager", "admin"] as const;
const ADMIN_ROLES = ["admin"] as const;

/**
 * Role hierarchy for visibility.
 * Higher roles can see users with roles below them.
 * E.g., admin sees manager/cashier/user; manager sees cashier/user.
 */
const ROLE_HIERARCHY: Record<string, string[]> = {
  admin: ["manager", "cashier", "user"],
  manager: ["cashier", "user"],
  cashier: ["user"],
  user: [],
};

interface AuthValidationResult {
  error?: { status: number; message: string };
  userId?: string;
  userRole?: string;
}

async function validateAdminAccess(
  request: Request,
  set: Record<string, unknown>,
): Promise<AuthValidationResult> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    set.status = 401;
    return { error: { status: 401, message: "Unauthorized" } };
  }

  const currentUser = await userRepository.findById(session.user.id);
  const userRole = currentUser?.role ?? "user";

  if (!ADMIN_ROLES.includes(userRole as (typeof ADMIN_ROLES)[number])) {
    set.status = 403;
    return { error: { status: 403, message: "Forbidden - admin role required" } };
  }

  return { userId: session.user.id, userRole };
}

async function validateAuthenticated(
  request: Request,
  set: Record<string, unknown>,
): Promise<AuthValidationResult> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    set.status = 401;
    return { error: { status: 401, message: "Unauthorized" } };
  }

  return { userId: session.user.id };
}

function validateRole(role?: string): boolean {
  return !role || VALID_ROLES.includes(role as (typeof VALID_ROLES)[number]);
}

function sanitizeUsername(
  username: string | undefined,
  firstName: string,
  lastName: string,
): string {
  return username?.trim() || `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
}

function validatePhoneNumber(phoneNumber?: string): boolean {
  return !phoneNumber || /^\d{10}$/.test(phoneNumber);
}

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
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const searchParams = new URL(request.url).searchParams;
      const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50")));
      const offset = Math.max(0, Number.parseInt(searchParams.get("offset") ?? "0"));
      const roleFilter = searchParams.get("role") as UserRole | null;
      const statusFilter = searchParams.get("status") as UserStatus | null;
      const search = searchParams.get("search") ?? undefined;

      // Apply role hierarchy: higher roles can only see users with roles below them
      const visibleRoles = ROLE_HIERARCHY[authResult.userRole ?? "user"] ?? [];

      // If user supplies a role filter, intersect it with the visible roles
      const allowedRoles = roleFilter ? visibleRoles.filter((r) => r === roleFilter) : visibleRoles;

      const filters: Record<string, unknown> = {};

      if (allowedRoles.length > 0) {
        filters.roles = allowedRoles;
      }

      // Exclude the logged-in user from the list
      filters.excludeId = authResult.userId;

      if (statusFilter) {
        filters.status = statusFilter;
      }

      if (search) {
        filters.search = search;
      }

      const result = await userRepository.findAll(
        filters as Parameters<typeof userRepository.findAll>[0],
        { limit, offset },
      );
      const total = await userRepository.count(
        filters as Parameters<typeof userRepository.count>[0],
      );

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
        description: "Returns a list of users. Requires admin role.",
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
    "/me",
    async ({ set, request }) => {
      const authResult = await validateAuthenticated(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const result = await userRepository.findById(authResult.userId!);
      if (!result) {
        set.status = 404;
        return { error: "User not found" };
      }

      return formatUserResponse(result);
    },
    {
      detail: {
        summary: "Get current user",
        description: "Returns the current user's profile with role.",
        tags: ["users"],
        responses: {
          200: { description: "User retrieved successfully" },
          401: { description: "Unauthorized" },
          404: { description: "User not found" },
        },
      },
    },
  )
  .get(
    "/:id",
    async ({ set, params, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

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
        description: "Returns a single user by ID. Requires admin role.",
        tags: ["users"],
        responses: {
          200: { description: "User retrieved successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin role required" },
          404: { description: "User not found" },
        },
      },
    },
  )
  .patch(
    "/me/profile",
    async ({ set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session || !session.user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const body = await request.json().catch(() => ({}));

      const { firstName, lastName, username } = body as {
        firstName?: string;
        lastName?: string;
        username?: string;
      };

      // Generate username if not provided - lowercase and replace spaces with _
      let finalUsername = username;
      if (!finalUsername && firstName && lastName) {
        finalUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
      } else if (!finalUsername && firstName) {
        finalUsername = firstName.toLowerCase().replace(/\s+/g, "_");
      }

      const updates: Record<string, unknown> = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (finalUsername !== undefined) updates.username = finalUsername;

      if (Object.keys(updates).length === 0) {
        set.status = 400;
        return { error: "No fields to update" };
      }

      await userRepository.update(session.user.id, updates);

      const updatedUser = await userRepository.findById(session.user.id);
      return formatUserResponse(updatedUser);
    },
    {
      detail: {
        summary: "Update current user profile",
        description:
          "Updates the current user's profile (firstName, lastName, username). Username is auto-generated if not provided.",
        tags: ["users"],
        responses: {
          200: { description: "User profile updated successfully" },
          401: { description: "Unauthorized" },
        },
      },
    },
  )
  .post(
    "/",
    async ({ set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const body = await request.json().catch(() => ({}));

      const { firstName, lastName, username, email, phoneNumber, role, roleId, password } =
        body as {
          firstName?: string;
          lastName?: string;
          username?: string;
          email?: string;
          phoneNumber?: string;
          role?: string;
          roleId?: string;
          password?: string;
        };

      if (!firstName || !lastName || !email || !password) {
        set.status = 400;
        return { error: "Missing required fields" };
      }

      if (!validatePhoneNumber(phoneNumber)) {
        set.status = 400;
        return { error: "Phone number must be exactly 10 digits" };
      }

      if (!validateRole(role)) {
        set.status = 400;
        return { error: "Invalid role" };
      }

      const finalUsername = sanitizeUsername(username, firstName, lastName);

      try {
        // Use internal HTTP fetch to the sign-up endpoint (same approach as db-seed.ts)
        // Direct auth.api.signUpEmail may throw due to missing request context in some versions
        const signUpResponse = await fetch(`${env.BETTER_AUTH_URL}/sign-up/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: `${firstName} ${lastName}`,
          }),
        });

        if (!signUpResponse.ok) {
          const errBody = await signUpResponse.json().catch(() => ({}));
          set.status = 400;
          return {
            error: errBody.message || errBody.error?.message || "Failed to create user",
          };
        }

        const signUpData = await signUpResponse.json();
        const userId = signUpData.user?.id ?? (await userRepository.findByEmail(email))?.id;

        if (!userId) {
          set.status = 500;
          return { error: "Failed to create user - no user returned or found" };
        }

        await userRepository.update(userId, {
          firstName,
          lastName,
          username: finalUsername,
          phoneNumber: phoneNumber || "",
          role: (role as UserRole) || "user",
          status: "active" as UserStatus,
        });

        // Link user to RBAC role if roleId is provided
        if (roleId) {
          await userRepository.assignRole(userId, roleId);
        }

        set.status = 201;
        return { success: true, userId };
      } catch (error) {
        console.error("User creation error:", error);
        set.status = 500;
        return { error: error instanceof Error ? error.message : "Failed to create user" };
      }
    },
    {
      detail: {
        summary: "Create new user",
        description: "Creates a new user. Requires admin role.",
        tags: ["users"],
        responses: {
          201: { description: "User created successfully" },
          400: { description: "Invalid request" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  .patch(
    "/:id",
    async ({ set, params, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const targetUser = await userRepository.findById(params.id);
      if (!targetUser) {
        set.status = 404;
        return { error: "User not found" };
      }

      const body = await request.json().catch(() => ({}));

      const { firstName, lastName, username, email, phoneNumber, role, roleId } = body as {
        firstName?: string;
        lastName?: string;
        username?: string;
        email?: string;
        phoneNumber?: string;
        role?: string;
        roleId?: string;
      };

      if (!validatePhoneNumber(phoneNumber)) {
        set.status = 400;
        return { error: "Phone number must be exactly 10 digits" };
      }

      if (!validateRole(role)) {
        set.status = 400;
        return { error: "Invalid role" };
      }

      const finalUsername = username
        ? username.trim()
        : firstName && lastName
          ? sanitizeUsername(undefined, firstName, lastName)
          : undefined;

      const updates: Record<string, unknown> = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (finalUsername !== undefined) updates.username = finalUsername;
      if (email !== undefined) updates.email = email;
      if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
      if (role !== undefined) updates.role = role;

      if (Object.keys(updates).length === 0 && roleId === undefined) {
        set.status = 400;
        return { error: "No fields to update" };
      }

      if (Object.keys(updates).length > 0) {
        await userRepository.update(params.id, updates);
      }

      // Update RBAC role assignment if roleId is provided
      if (roleId !== undefined) {
        // Remove existing roles first, then assign the new one
        const existingRoles = await userRepository.getUserRoles(params.id);
        for (const existingRole of existingRoles) {
          await userRepository.removeUserRole(params.id, existingRole.id);
        }
        await userRepository.assignRole(params.id, roleId);
      }

      const updatedUser = await userRepository.findById(params.id);
      return formatUserResponse(updatedUser);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Update user",
        description: "Updates user details. Requires admin role.",
        tags: ["users"],
        responses: {
          200: { description: "User updated successfully" },
          400: { description: "Invalid request" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin role required" },
          404: { description: "User not found" },
        },
      },
    },
  )
  .patch(
    "/:id/status",
    async ({ set, params, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const targetUser = await userRepository.findById(params.id);
      if (!targetUser) {
        set.status = 404;
        return { error: "User not found" };
      }

      const body = await request.json().catch(() => ({}));
      const { status } = body as { status?: UserStatus };

      if (!status || !["active", "inactive", "suspended"].includes(status)) {
        set.status = 400;
        return { error: "Invalid status. Must be 'active', 'inactive', or 'suspended'" };
      }

      await userRepository.update(params.id, { status });

      return { success: true, status };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Update user status",
        description: "Soft delete or restore user by updating status. Requires admin role.",
        tags: ["users"],
        responses: {
          200: { description: "User status updated successfully" },
          400: { description: "Invalid status" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin role required" },
          404: { description: "User not found" },
        },
      },
    },
  )
  .post(
    "/:id/reset-password",
    async ({ set, params, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const targetUser = await userRepository.findById(params.id);
      if (!targetUser) {
        set.status = 404;
        return { error: "User not found" };
      }

      const generatedPassword = Math.random().toString(36).slice(-8) + "A1!";

      const { hash } = await import("@node-rs/argon2");
      const hashOpts = {
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
        outputLen: 32,
        algorithm: 2,
      };
      const hashedPassword = await hash(generatedPassword, hashOpts);

      const { db } = await import("~/config/db");
      const { accounts } = await import("~/lib/db");
      const { eq } = await import("drizzle-orm");

      await db
        .update(accounts)
        .set({ password: hashedPassword })
        .where(eq(accounts.userId, params.id));

      return { password: generatedPassword };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Reset user password",
        description: "Generates a new password for the user. Requires admin role.",
        tags: ["users"],
        responses: {
          400: { description: "Feature not available" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  );