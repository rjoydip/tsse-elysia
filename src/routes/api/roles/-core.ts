/**
 * Roles and Permissions API endpoints.
 * Provides CRUD operations for roles and permissions.
 */

import { Elysia, t } from "elysia";
import { auth } from "~/lib/auth";
import {
  rolesService,
  type RoleResponse,
  type PermissionResponse,
} from "~/services/dashboard/roles";

import { userRepository } from "~/repositories/users";

const ADMIN_ROLES = ["superadmin", "admin"] as const;

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

/**
 * Permission response example.
 */
const permissionExample: PermissionResponse = {
  id: "perm_123",
  name: "dashboard:read",
  description: "Access to read dashboard",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Role response example.
 */
const roleExample: RoleResponse = {
  id: "role_123",
  name: "admin",
  description: "Administrator role",
  isDefault: false,
  permissions: ["dashboard:read", "dashboard:write"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Roles API routes.
 */
export const rolesRoutes = new Elysia({
  name: "api.routes.roles",
  prefix: "/roles",
})
  /**
   * GET /api/roles/permissions - Get all permissions
   */
  .get(
    "/permissions",
    async ({ set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const permissions = await rolesService.getAllPermissions();
      return { permissions };
    },
    {
      detail: {
        summary: "Get all permissions",
        description:
          "Returns a list of all permissions in the system. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          200: {
            description: "Permissions retrieved successfully",
            content: { "application/json": { example: { permissions: [permissionExample] } } },
          },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * POST /api/roles/permissions - Create a new permission
   */
  .post(
    "/permissions",
    async ({ body, set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const { name, description } = body as { name: string; description?: string };

      try {
        const permission = await rolesService.createPermission({ name, description });
        set.status = 201;
        return { permission };
      } catch (err) {
        set.status = 400;
        return { error: err instanceof Error ? err.message : "Failed to create permission" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
      detail: {
        summary: "Create a new permission",
        description: "Creates a new permission in the system. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          201: { description: "Permission created successfully" },
          400: { description: "Invalid request or permission already exists" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * PUT /api/roles/permissions/:id - Update a permission
   */
  .put(
    "/permissions/:id",
    async ({ params, body, set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const { id } = params as { id: string };
      const { name, description } = body as { name?: string; description?: string };

      try {
        const permission = await rolesService.updatePermission(id, { name, description });
        return { permission };
      } catch (err) {
        set.status = 400;
        return { error: err instanceof Error ? err.message : "Failed to update permission" };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
      }),
      detail: {
        summary: "Update a permission",
        description: "Updates an existing permission. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          200: { description: "Permission updated successfully" },
          400: { description: "Invalid request or permission not found" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * DELETE /api/roles/permissions/:id - Delete a permission
   */
  .delete(
    "/permissions/:id",
    async ({ params, set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const { id } = params as { id: string };

      const deleted = await rolesService.deletePermission(id);
      if (!deleted) {
        set.status = 404;
        return { error: "Permission not found" };
      }

      return { success: true };
    },
    {
      detail: {
        summary: "Delete a permission",
        description: "Deletes a permission from the system. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          200: { description: "Permission deleted successfully" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * POST /api/roles/permissions/seed - Seed default system permissions
   */
  .post(
    "/permissions/seed",
    async ({ set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      await rolesService.seedDefaultPermissions();
      return { success: true, message: "Default permissions seeded successfully" };
    },
    {
      detail: {
        summary: "Seed default permissions",
        description:
          "Creates system-defined permissions from the codebase. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          200: { description: "Default permissions seeded" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * GET /api/roles - Get all roles
   */
  .get(
    "/",
    async ({ set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const roles = await rolesService.getAllRoles();
      return { roles };
    },
    {
      detail: {
        summary: "Get all roles",
        description:
          "Returns a list of all roles in the system with their permissions. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          200: {
            description: "Roles retrieved successfully",
            content: { "application/json": { example: { roles: [roleExample] } } },
          },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * POST /api/roles - Create a new role
   */
  .post(
    "/",
    async ({ body, set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const { name, description, isDefault, permissionIds } = body as {
        name: string;
        description?: string;
        isDefault?: boolean;
        permissionIds?: string;
      };

      try {
        const role = await rolesService.createRole({ name, description, isDefault, permissionIds });
        set.status = 201;
        return { role };
      } catch (err) {
        set.status = 400;
        return { error: err instanceof Error ? err.message : "Failed to create role" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        isDefault: t.Optional(t.Boolean()),
        permissionIds: t.Optional(t.String()),
      }),
      detail: {
        summary: "Create a new role",
        description: "Creates a new role in the system. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          201: { description: "Role created successfully" },
          400: { description: "Invalid request or role already exists" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * GET /api/roles/:id - Get a specific role
   */
  .get(
    "/:id",
    async ({ params, set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const { id } = params as { id: string };
      const role = await rolesService.getRole(id);

      if (!role) {
        set.status = 404;
        return { error: "Role not found" };
      }

      return { role };
    },
    {
      detail: {
        summary: "Get a specific role",
        description: "Returns a single role by ID. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          200: { description: "Role retrieved successfully" },
          404: { description: "Role not found" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * PUT /api/roles/:id - Update a role
   */
  .put(
    "/:id",
    async ({ params, body, set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const { id } = params as { id: string };
      const { name, description, isDefault, permissionIds } = body as {
        name?: string;
        description?: string;
        isDefault?: boolean;
        permissionIds?: string;
      };

      try {
        const role = await rolesService.updateRole(id, {
          name,
          description,
          isDefault,
          permissionIds,
        });
        return { role };
      } catch (err) {
        set.status = 400;
        return { error: err instanceof Error ? err.message : "Failed to update role" };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        isDefault: t.Optional(t.Boolean()),
        permissionIds: t.Optional(t.String()),
      }),
      detail: {
        summary: "Update a role",
        description: "Updates an existing role. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          200: { description: "Role updated successfully" },
          400: { description: "Invalid request or role not found" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  )
  /**
   * DELETE /api/roles/:id - Delete a role
   */
  .delete(
    "/:id",
    async ({ params, set, request }) => {
      const authResult = await validateAdminAccess(request, set);
      if (authResult.error) return { error: authResult.error.message };

      const { id } = params as { id: string };

      const deleted = await rolesService.deleteRole(id);
      if (!deleted) {
        set.status = 404;
        return { error: "Role not found" };
      }

      return { success: true };
    },
    {
      detail: {
        summary: "Delete a role",
        description: "Deletes a role from the system. Requires admin or superadmin role.",
        tags: ["roles"],
        responses: {
          200: { description: "Role deleted successfully" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  );