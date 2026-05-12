/**
 * Users API endpoints.
 * Lists users from database - admin role required.
 */

import { Elysia, t } from "elysia";
import { auth } from "~/lib/auth";
import { userRepository } from "~/repositories/users";
import type { User, UserRole, UserStatus } from "~/features/users/data/schema";

const VALID_ROLES = ["user", "cashier", "manager", "admin", "superadmin"] as const;
const ADMIN_ROLES = ["superadmin", "admin"] as const;

interface AuthValidationResult {
  error?: { status: number; message: string };
  userId?: string;
  userRole?: string;
}

async function validateAdminAccess(request: Request, set: Record<string, unknown>): Promise<AuthValidationResult> {
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

async function validateAuthenticated(request: Request, set: Record<string, unknown>): Promise<AuthValidationResult> {
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

function sanitizeUsername(username: string | undefined, firstName: string, lastName: string): string {
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

      const { firstName, lastName, username, email, phoneNumber, role, password } = body as {
        firstName?: string;
        lastName?: string;
        username?: string;
        email?: string;
        phoneNumber?: string;
        role?: string;
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

      let signUpResult: Awaited<ReturnType<typeof auth.api.signUpEmail>> | null = null;

      try {
        signUpResult = await auth.api.signUpEmail({
          body: {
            email,
            password,
            name: `${firstName} ${lastName}`,
          },
        });

        if (signUpResult.error) {
          set.status = 400;
          return { error: signUpResult.error.message || "Failed to create user" };
        }

        if (!signUpResult.user) {
          set.status = 500;
          return { error: "Failed to create user - no user returned" };
        }

        await userRepository.update(signUpResult.user.id, {
          firstName,
          lastName,
          username: finalUsername,
          phoneNumber: phoneNumber || "",
          role: (role as UserRole) || "user",
          status: "active" as UserStatus,
        });

        return { success: true, userId: signUpResult.user.id };
      } catch (error) {
        console.error("User creation error:", error);
        if (signUpResult?.user) {
          try {
            await auth.api.deleteAccount({ userId: signUpResult.user.id });
          } catch {
            console.error("Failed to cleanup orphaned account:", signUpResult.user.id);
          }
        }
        set.status = 500;
        return { error: "Failed to create user" };
      }
    },
    {
      detail: {
        summary: "Create new user",
        description: "Creates a new user. Requires admin or superadmin role.",
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

      const { firstName, lastName, username, email, phoneNumber, role } = body as {
        firstName?: string;
        lastName?: string;
        username?: string;
        email?: string;
        phoneNumber?: string;
        role?: string;
      };

      if (!validatePhoneNumber(phoneNumber)) {
        set.status = 400;
        return { error: "Phone number must be exactly 10 digits" };
      }

      if (!validateRole(role)) {
        set.status = 400;
        return { error: "Invalid role" };
      }

      const finalUsername = username ? username.trim() : (firstName && lastName ? sanitizeUsername(undefined, firstName, lastName) : undefined);

      const updates: Record<string, unknown> = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (finalUsername !== undefined) updates.username = finalUsername;
      if (email !== undefined) updates.email = email;
      if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
      if (role !== undefined) updates.role = role;

      if (Object.keys(updates).length === 0) {
        set.status = 400;
        return { error: "No fields to update" };
      }

      await userRepository.update(params.id, updates);

      const updatedUser = await userRepository.findById(params.id);
      return formatUserResponse(updatedUser);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Update user",
        description: "Updates user details. Requires admin or superadmin role.",
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
        description:
          "Soft delete or restore user by updating status. Requires admin or superadmin role.",
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
      const { accounts } = await import("~/lib/db/schema/auth");
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
        description: "Generates a new password for the user. Requires admin or superadmin role.",
        tags: ["users"],
        responses: {
          400: { description: "Feature not available" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  );