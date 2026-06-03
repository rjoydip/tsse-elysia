/**
 * Roles and Permissions controller.
 * Handles session validation, request parsing, and response formatting
 * for role and permission API endpoints.
 */

import { auth } from "~/lib/auth";
import type { UserRole } from "~/lib/auth/permissions";
import { userRepository } from "~/repositories/users";
import { permissionResolver } from "~/services/roles/permission-resolver.service";
import {
  rolesService,
  type PermissionResponse,
  type RoleResponse,
} from "~/services/dashboard/roles";

const ADMIN_ROLES = ["superadmin", "admin"] as const;

/**
 * Unified auth validation result.
 */
interface AuthResult {
  error?: { status: number; message: string };
  userId?: string;
  userRole?: string;
}

/**
 * Validates that the request has an active admin session.
 * Used by all roles/permissions endpoints.
 */
async function validateAdminAccess(
  request: Request,
  set: Record<string, unknown>,
): Promise<AuthResult> {
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
 * Validates that the request has an active session (any authenticated user).
 */
async function validateAuthenticated(
  request: Request,
  set: Record<string, unknown>,
): Promise<AuthResult> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    set.status = 401;
    return { error: { status: 401, message: "Unauthorized" } };
  }

  return { userId: session.user.id, userRole: "authenticated" };
}

/**
 * Wraps service calls that may throw into consistent error responses.
 */
function handleServiceError(err: unknown, set: Record<string, unknown>, defaultMsg: string) {
  set.status = 400;
  return { error: err instanceof Error ? err.message : defaultMsg };
}

// ---- Permission Handlers ----

/**
 * GET /api/roles/permissions - List all permissions.
 */
export async function handleGetPermissions(
  request: Request,
  set: Record<string, unknown>,
): Promise<{ permissions: PermissionResponse[] } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  const permissions = await rolesService.getAllPermissions();
  return { permissions };
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

/**
 * POST /api/roles/permissions/seed - Seed default system permissions.
 */
export async function handleSeedPermissions(
  request: Request,
  set: Record<string, unknown>,
): Promise<{ success: boolean; message: string } | { error: string }> {
  const authResult = await validateAdminAccess(request, set);
  if (authResult.error) return { error: authResult.error.message };

  await rolesService.seedDefaultPermissions();
  return { success: true, message: "Default permissions seeded successfully" };
}

/**
 * GET /api/roles/permissions/mine - Get current user's effective permissions.
 */
export async function handleGetMyPermissions(
  request: Request,
  set: Record<string, unknown>,
): Promise<{ permissions: string[] } | { error: string }> {
  const authResult = await validateAuthenticated(request, set);
  if (authResult.error) return { error: authResult.error.message };

  const userId = authResult.userId!;
  const currentUser = await userRepository.findById(userId);
  const fallbackRole = (currentUser?.role ?? "user") as UserRole;

  const permissions = await permissionResolver.getEffectivePermissions(userId, fallbackRole);
  return { permissions };
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

  const roles = await rolesService.getAllRoles();
  return { roles };
}

/**
 * POST /api/roles - Create a new role.
 */
export async function handleCreateRole(
  request: Request,
  set: Record<string, unknown>,
  body: { name: string; description?: string; isDefault?: boolean; permissionIds?: string },
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
  body: { name?: string; description?: string; isDefault?: boolean; permissionIds?: string },
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