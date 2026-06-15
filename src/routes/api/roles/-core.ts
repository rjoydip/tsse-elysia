/**
 * Roles and Permissions API endpoints.
 * Provides CRUD operations for roles and permissions.
 * Delegates to controller layer for session validation and response formatting.
 */

import { Elysia, t } from "elysia";
import {
  handleGetMyPermissions,
  handleGetPermissions,
  handleCreatePermission,
  handleUpdatePermission,
  handleDeletePermission,
  handleGetRoles,
  handleCreateRole,
  handleGetRole,
  handleUpdateRole,
  handleDeleteRole,
} from "~/controllers/roles";
import type { PermissionResponse, RoleResponse } from "~/services/dashboard/roles";

/**
 * Permission response example for OpenAPI docs.
 */
const permissionExample: PermissionResponse = {
  id: "perm_123",
  name: "dashboard:read",
  description: "Access to read dashboard",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Role response example for OpenAPI docs.
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
  .get("/permissions", async ({ set, request }) => handleGetPermissions(request, set), {
    detail: {
      summary: "Get all permissions",
      description: "Returns a list of all permissions in the system. Requires admin role.",
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
  })
  /**
   * GET /api/roles/permissions/mine - Get current user's effective permissions
   */
  .get("/permissions/mine", async ({ set, request }) => handleGetMyPermissions(request, set), {
    detail: {
      summary: "Get my permissions",
      description:
        "Returns all effective permissions for the current authenticated user, resolved from their DB-assigned roles. Falls back to hardcoded role-based permissions if no DB roles are found.",
      tags: ["roles"],
      responses: {
        200: { description: "Permissions retrieved successfully" },
        401: { description: "Unauthorized - no active session" },
      },
    },
  })
  /**
   * POST /api/roles/permissions - Create a new permission
   */
  .post(
    "/permissions",
    async ({ body, set, request }) => {
      const { name, description } = body as { name: string; description?: string };
      return handleCreatePermission(request, set, { name, description });
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 64 }),
        description: t.Optional(t.String({ maxLength: 255 })),
      }),
      detail: {
        summary: "Create a new permission",
        description: "Creates a new permission in the system. Requires admin role.",
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
    async ({ params: { id }, body, set, request }) => {
      const { name, description } = body as { name?: string; description?: string };
      return handleUpdatePermission(request, set, id, { name, description });
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
        description: t.Optional(t.String({ maxLength: 255 })),
      }),
      detail: {
        summary: "Update a permission",
        description: "Updates an existing permission. Requires admin role.",
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
    async ({ params: { id }, set, request }) => {
      return handleDeletePermission(request, set, id);
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Delete a permission",
        description: "Deletes a permission from the system. Requires admin role.",
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
   * GET /api/roles - Get all roles
   */
  .get("/", async ({ set, request }) => handleGetRoles(request, set), {
    detail: {
      summary: "Get all roles",
      description:
        "Returns a list of all roles in the system with their permissions. Requires admin role.",
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
  })
  /**
   * POST /api/roles - Create a new role
   */
  .post(
    "/",
    async ({ body, set, request }) => {
      const { name, description, isDefault, permissionIds } = body as {
        name: string;
        description?: string;
        isDefault?: boolean;
        permissionIds?: string[];
      };
      return handleCreateRole(request, set, { name, description, isDefault, permissionIds });
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 64 }),
        description: t.Optional(t.String({ maxLength: 255 })),
        isDefault: t.Optional(t.Boolean()),
        permissionIds: t.Optional(t.Array(t.String())),
      }),
      detail: {
        summary: "Create a new role",
        description: "Creates a new role in the system. Requires admin role.",
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
    async ({ params: { id }, set, request }) => {
      return handleGetRole(request, set, id);
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Get a specific role",
        description: "Returns a single role by ID. Requires admin role.",
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
    async ({ params: { id }, body, set, request }) => {
      const { name, description, isDefault, permissionIds } = body as {
        name?: string;
        description?: string;
        isDefault?: boolean;
        permissionIds?: string[];
      };
      return handleUpdateRole(request, set, id, { name, description, isDefault, permissionIds });
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
        description: t.Optional(t.String({ maxLength: 255 })),
        isDefault: t.Optional(t.Boolean()),
        permissionIds: t.Optional(t.Array(t.String())),
      }),
      detail: {
        summary: "Update a role",
        description: "Updates an existing role. Requires admin role.",
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
    async ({ params: { id }, set, request }) => {
      return handleDeleteRole(request, set, id);
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Delete a role",
        description: "Deletes a role from the system. Requires admin role.",
        tags: ["roles"],
        responses: {
          200: { description: "Role deleted successfully" },
          401: { description: "Unauthorized - no active session" },
          403: { description: "Forbidden - admin role required" },
        },
      },
    },
  );