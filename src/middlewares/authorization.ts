/**
 * Authorization middleware for Elysia.
 * Provides centralized auth validation across all routes.
 * Extracted from duplicate inline patterns in roles and users routes.
 */

import { Elysia } from "elysia";
import { auth } from "~/lib/auth";
import { userRepository } from "~/repositories/users";
import { roleHierarchy, ADMIN_ROLES, type UserRole } from "~/lib/auth/permissions";
import { permissionResolver } from "~/services/roles/permission-resolver.service";

/**
 * Safely casts a role string to UserRole, falling back to "user" if invalid.
 */
function toUserRole(role: string | null | undefined): UserRole {
  const validRoles = Object.keys(roleHierarchy);
  if (role && validRoles.includes(role)) {
    return role as UserRole;
  }
  return "user";
}

/**
 * Result of authentication validation.
 */
export interface AuthValidationResult {
  error?: { status: number; message: string };
  userId?: string;
  userRole?: string;
}

/**
 * Validates admin access (superadmin or admin role) for use in controllers.
 * Standalone version that doesn't require Elysia context.
 */
export async function validateAdminAccess(
  request: Request,
  set: Record<string, unknown>,
): Promise<AuthValidationResult> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    set.status = 401;
    return { error: { status: 401, message: "Unauthorized" } };
  }

  const currentUser = await userRepository.findById(session.user.id);
  const userRole = toUserRole(currentUser?.role);

  if (!ADMIN_ROLES.includes(userRole)) {
    set.status = 403;
    return {
      error: { status: 403, message: "Forbidden - admin role required" },
    };
  }

  return { userId: session.user.id, userRole };
}

/**
 * Standalone authentication check (no role requirement).
 * Returns userId if authenticated, or sets 401 error.
 */
export async function validateAuth(
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

/**
 * Authorization middleware plugin for Elysia.
 * Registers guard methods that can be used by route handlers.
 */
export const authorizationMiddleware = new Elysia({ name: "middleware.authorization" }).derive(
  { as: "global" },
  () => {
    return {
      /**
       * Validates that the request has an active session.
       */
      async requireAuth(
        request: Request,
        set: Record<string, unknown>,
      ): Promise<AuthValidationResult> {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          set.status = 401;
          return { error: { status: 401, message: "Unauthorized" } };
        }

        return { userId: session.user.id };
      },

      /**
       * Validates that the request has an active session and the user has one of the required roles.
       */
      async requireRole(
        request: Request,
        set: Record<string, unknown>,
        allowedRoles: string[],
      ): Promise<AuthValidationResult> {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          set.status = 401;
          return { error: { status: 401, message: "Unauthorized" } };
        }

        const currentUser = await userRepository.findById(session.user.id);
        const userRole = currentUser?.role ?? "user";

        if (!allowedRoles.includes(userRole)) {
          set.status = 403;
          return {
            error: {
              status: 403,
              message: `Forbidden - required role: ${allowedRoles.join(" or ")}`,
            },
          };
        }

        return { userId: session.user.id, userRole };
      },

      /**
       * Validates that the request has an active session and the user has a specific permission.
       */
      async requirePermission(
        request: Request,
        set: Record<string, unknown>,
        requiredPermission: string,
      ): Promise<AuthValidationResult> {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          set.status = 401;
          return { error: { status: 401, message: "Unauthorized" } };
        }

        const currentUser = await userRepository.findById(session.user.id);
        const userRole = toUserRole(currentUser?.role);

        const hasPerm = await permissionResolver.hasPermission(
          session.user.id,
          requiredPermission,
          userRole,
        );

        if (!hasPerm) {
          set.status = 403;
          return { error: { status: 403, message: "Forbidden - insufficient permissions" } };
        }

        return { userId: session.user.id, userRole };
      },

      /**
       * Validates that the user's role meets a minimum role requirement.
       */
      async requireMinRole(
        request: Request,
        set: Record<string, unknown>,
        minRole: UserRole,
      ): Promise<AuthValidationResult> {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          set.status = 401;
          return { error: { status: 401, message: "Unauthorized" } };
        }

        const currentUser = await userRepository.findById(session.user.id);
        const userRole = toUserRole(currentUser?.role);

        if (roleHierarchy[userRole] < roleHierarchy[minRole]) {
          set.status = 403;
          return {
            error: {
              status: 403,
              message: `Forbidden - minimum role required: ${minRole}`,
            },
          };
        }

        return { userId: session.user.id, userRole };
      },

      /**
       * Validates admin access (superadmin or admin role).
       * Convenience wrapper with ADMIN_ROLES check.
       */
      async validateAdminAccess(
        request: Request,
        set: Record<string, unknown>,
      ): Promise<AuthValidationResult> {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          set.status = 401;
          return { error: { status: 401, message: "Unauthorized" } };
        }

        const currentUser = await userRepository.findById(session.user.id);
        const userRole = toUserRole(currentUser?.role);

        if (!ADMIN_ROLES.includes(userRole)) {
          set.status = 403;
          return {
            error: { status: 403, message: "Forbidden - admin role required" },
          };
        }

        return { userId: session.user.id, userRole };
      },
    };
  },
);