/**
 * Authorization middleware for Elysia.
 * Provides centralized auth validation across all routes.
 * Extracted from duplicate inline patterns in roles and users routes.
 *
 * ## Authorization Paths
 *
 * All guard methods now resolve the user's effective role from the DB junction
 * tables (userRoles → roles) via userRepository.getEffectiveRole(). This is
 * the single source of truth for role assignments.
 *
 *   - requireRole / requireMinRole / validateAdminAccess
 *     → userRepository.getEffectiveRole()  (DB junction table)
 *
 *   - requirePermission
 *     → permissionResolver.hasPermission()  (DB junction table, hardcoded fallback)
 *
 * The denormalized users.role column is only used as a fallback when the
 * junction table has no entries for the user.
 *
 * @see src/lib/auth/permissions.ts for hardcoded role/permission definitions
 * @see src/repositories/users.ts:getEffectiveRole for DB role resolution
 */

import { Elysia } from "elysia";
import { auth } from "~/lib/auth";
import { userRepository } from "~/repositories/users";
import { roleHierarchy, ADMIN_ROLES, type UserRole } from "~/lib/auth/permissions";
import { permissionResolver } from "~/services/roles/permission-resolver.service";

/**
 * Result of authentication validation.
 */
export interface AuthValidationResult {
  error?: { status: number; message: string };
  userId?: string;
  userRole?: string;
}

/**
 * Validates admin access for use in controllers.
 * Standalone version that doesn't require Elysia context.
 *
 * Resolves role from DB junction tables (single source of truth).
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

  const userRole = await userRepository.getEffectiveRole(session.user.id);

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
 *
 * Resolves role from DB junction tables (single source of truth).
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

  const userRole = await userRepository.getEffectiveRole(session.user.id);

  return { userId: session.user.id, userRole };
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
       *
       * Role is resolved from the DB junction tables (userRoles → roles).
       * Users may have multiple roles — this method ORs across all assigned roles.
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

        const userRole = await userRepository.getEffectiveRole(session.user.id);

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
       *
       * Permission is resolved from the DB junction tables (userRoles → rolePermissions → permissions).
       * Falls back to the hardcoded ROLE_PERMISSIONS dict if the DB returns no results.
       * The fallback role is resolved from userRoles via getEffectiveRole().
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

        const userRole = await userRepository.getEffectiveRole(session.user.id);

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
       *
       * Role is resolved from the DB junction tables (userRoles → roles).
       * The highest-ranked role is compared against the minimum via roleHierarchy.
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

        const userRole = await userRepository.getEffectiveRole(session.user.id);

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
       * Validates admin access.
       * Convenience wrapper with ADMIN_ROLES check.
       *
       * Role is resolved from the DB junction tables (single source of truth).
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

        const userRole = await userRepository.getEffectiveRole(session.user.id);

        if (!ADMIN_ROLES.includes(userRole)) {
          set.status = 403;
          return {
            error: { status: 403, message: "Forgibidden - admin role required" },
          };
        }

        return { userId: session.user.id, userRole };
      },
    };
  },
);