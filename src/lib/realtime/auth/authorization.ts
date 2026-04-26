/**
 * RBAC (Role-Based Access Control) for WebSocket messages.
 * Defines roles and permissions for different message types.
 */

import type { User } from "~/lib/auth";
import { logger } from "~/lib/logger";

/**
 * User roles in the system.
 */
export type UserRole = "admin" | "moderator" | "user" | "guest";

/**
 * Permission types for WebSocket operations.
 */
export type Permission =
  | "notification:read"
  | "notification:write"
  | "presence:read"
  | "presence:write"
  | "chat:read"
  | "chat:write"
  | "chat:delete"
  | "dashboard:read"
  | "dashboard:write"
  | "admin:manage";

/**
 * Role to permission mapping.
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "notification:read",
    "notification:write",
    "presence:read",
    "presence:write",
    "chat:read",
    "chat:write",
    "chat:delete",
    "dashboard:read",
    "dashboard:write",
    "admin:manage",
  ],
  moderator: [
    "notification:read",
    "notification:write",
    "presence:read",
    "presence:write",
    "chat:read",
    "chat:write",
    "chat:delete",
    "dashboard:read",
  ],
  user: [
    "notification:read",
    "notification:write",
    "presence:read",
    "presence:write",
    "chat:read",
    "chat:write",
    "dashboard:read",
  ],
  guest: ["presence:read", "dashboard:read"],
};

/**
 * Determines user role from user object.
 * Currently defaults to 'user' - can be extended to check database roles.
 *
 * @param user - User object from authentication
 * @returns User role
 */
export function getUserRole(user: User | null): UserRole {
  // TODO: Check user's role in database
  // For now, all authenticated users are 'user', guests are 'guest'
  return user ? "user" : "guest";
}

/**
 * Checks if a role has a specific permission.
 *
 * @param role - User role to check
 * @param permission - Permission to verify
 * @returns True if role has permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Gets all permissions for a role.
 *
 * @param role - User role
 * @returns Array of permissions
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Authorization check for WebSocket messages.
 * Validates that the user has permission to perform the action.
 *
 * @param user - Authenticated user or null for anonymous
 * @param permission - Required permission
 * @returns True if authorized
 *
 * @example
 * if (!authorize(user, 'chat:write')) {
 *   return { type: 'error', error: { code: 'FORBIDDEN', message: 'Cannot send messages' } };
 * }
 */
export function authorize(user: User | null, permission: Permission): boolean {
  const role = getUserRole(user);
  const allowed = hasPermission(role, permission);

  if (!allowed) {
    logger.warn(`Authorization denied: role ${role} attempted ${permission}`);
  }

  return allowed;
}

/**
 * Creates an authorization guard function.
 * Returns a function that checks permission before allowing action.
 *
 * @param permission - Permission required for the action
 * @returns Guard function that takes user and returns boolean
 *
 * @example
 * const requireChatWrite = createGuard('chat:write');
 * if (!requireChatWrite(user)) {
 *   ws.close(1008, 'Insufficient permissions');
 * }
 */
export function createGuard(permission: Permission): (user: User | null) => boolean {
  return (user: User | null) => authorize(user, permission);
}

/**
 * Middleware-like function for checking message authorization.
 * Returns error message if not authorized, null if OK.
 *
 * @param user - Authenticated user or null
 * @param permission - Required permission
 * @returns Error object if unauthorized, null otherwise
 */
export function checkAuthorization(
  user: User | null,
  permission: Permission,
): { code: string; message: string } | null {
  if (!authorize(user, permission)) {
    return {
      code: "FORBIDDEN",
      message: `Permission denied: ${permission}`,
    };
  }
  return null;
}

/**
 * Role hierarchy for comparison.
 * Higher roles inherit permissions from lower roles.
 */
export const roleHierarchy: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  moderator: 2,
  admin: 3,
};

/**
 * Checks if a role is equal or higher than required.
 *
 * @param userRole - User's role
 * @param requiredRole - Minimum required role
 * @returns True if user meets role requirement
 */
export function meetsRoleRequirement(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}