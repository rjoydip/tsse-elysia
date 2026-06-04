/**
 * Roles and Permissions controller.
 * Handles session validation, request parsing, and response formatting
 * for role and permission API endpoints.
 */

import { validateAdminAccess, validateAuth } from "~/middlewares/authorization";
import { permissionResolver } from "~/services/roles/permission-resolver.service";
import {
  rolesService,
  type PermissionResponse,
  type RoleResponse,
} from "~/services/dashboard/roles";

/**
 * Wraps service calls that may throw into consistent error responses.
 */
function handleServiceError(
  err: unknown,
  set: Record<string, unknown>,
  defaultMsg: string,
  status: number = 400,
) {
  set.status = status;
  return { error: err instanceof Error ? err.message : defaultMsg };
}

// ---- Permission Handlers ----

/**
 * GET /api/roles/permissions/mine - Get current user's effective permissions.
 */
export async function handleGetMyPermissions(
  request: Request,
  set: Record<string, unknown>,
): Promise<{ permissions: string[] } | { error: string }> {
  const authResult = await validateAuth(request, set);
  if (authResult.error) return { error: authResult.error.message };

  try {
    const permissions = await permissionResolver.getEffectivePermissions(
      authResult.userId!,
      authResult.userRole as Parameters<typeof permissionResolver.getEffectivePermissions>[1],
    );
    return { permissions };
  } catch (err) {
    return handleServiceError(err, set, "Failed to fetch permissions", 500);
  }
}

/**
 * GET /api/roles/permissions - List all permissions.
 */
export async function handleGetPermissions(
  request: Request,
  set: Record<string, unknown>,
): Promise<{ permissions: PermissionResponse[] } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  try {
    const permissions = await rolesService.getAllPermissions();
    return { permissions };
  } catch (err) {
    return handleServiceError(err, set, "Failed to fetch permissions", 500);
  }
}

/**
 * POST /api/roles/permissions - Create a new permission.
 */
export async function handleCreatePermission(
  request: Request,
  set: Record<string, unknown>,
  body: { name: string; description?: string },
): Promise<{ permission: PermissionResponse } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  try {
    const permission = await rolesService.createPermission(body);
    set.status = 201;
    return { permission };
  } catch (err) {
    return handleServiceError(err, set, "Failed to create permission");
  }
}

/**
 * PUT /api/roles/permissions/:id - Update a permission.
 */
export async function handleUpdatePermission(
  request: Request,
  set: Record<string, unknown>,
  id: string,
  body: { name?: string; description?: string },
): Promise<{ permission: PermissionResponse } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  try {
    const permission = await rolesService.updatePermission(id, body);
    return { permission };
  } catch (err) {
    return handleServiceError(err, set, "Failed to update permission");
  }
}

/**
 * DELETE /api/roles/permissions/:id - Delete a permission.
 */
export async function handleDeletePermission(
  request: Request,
  set: Record<string, unknown>,
  id: string,
): Promise<{ success: boolean } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  const deleted = await rolesService.deletePermission(id);
  if (!deleted) {
    set.status = 404;
    return { error: "Permission not found" };
  }

  return { success: true };
}

// ---- Role Handlers ----

/**
 * GET /api/roles - List all roles.
 */
export async function handleGetRoles(
  request: Request,
  set: Record<string, unknown>,
): Promise<{ roles: RoleResponse[] } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  try {
    const roles = await rolesService.getAllRoles();
    return { roles };
  } catch (err) {
    return handleServiceError(err, set, "Failed to fetch roles", 500);
  }
}

/**
 * POST /api/roles - Create a new role.
 */
export async function handleCreateRole(
  request: Request,
  set: Record<string, unknown>,
  body: { name: string; description?: string; isDefault?: boolean; permissionIds?: string[] },
): Promise<{ role: RoleResponse } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  try {
    const role = await rolesService.createRole(body);
    set.status = 201;
    return { role };
  } catch (err) {
    return handleServiceError(err, set, "Failed to create role");
  }
}

/**
 * GET /api/roles/:id - Get a specific role.
 */
export async function handleGetRole(
  request: Request,
  set: Record<string, unknown>,
  id: string,
): Promise<{ role: RoleResponse } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  const role = await rolesService.getRole(id);
  if (!role) {
    set.status = 404;
    return { error: "Role not found" };
  }

  return { role };
}

/**
 * PUT /api/roles/:id - Update a role.
 */
export async function handleUpdateRole(
  request: Request,
  set: Record<string, unknown>,
  id: string,
  body: { name?: string; description?: string; isDefault?: boolean; permissionIds?: string[] },
): Promise<{ role: RoleResponse } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  try {
    const role = await rolesService.updateRole(id, body);
    return { role };
  } catch (err) {
    return handleServiceError(err, set, "Failed to update role");
  }
}

/**
 * DELETE /api/roles/:id - Delete a role.
 */
export async function handleDeleteRole(
  request: Request,
  set: Record<string, unknown>,
  id: string,
): Promise<{ success: boolean } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  const deleted = await rolesService.deleteRole(id);
  if (!deleted) {
    set.status = 404;
    return { error: "Role not found" };
  }

  return { success: true };
}