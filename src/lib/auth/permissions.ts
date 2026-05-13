/**
 * Role-Based Access Control (RBAC) permissions for the application.
 * Defines user roles, permissions, and role hierarchy for dashboard access.
 */

import { z } from "zod";

/**
 * User roles in the system.
 * Ordered from lowest to highest privilege.
 */
export const userRoleSchema = z.union([
  z.literal("superadmin"),
  z.literal("admin"),
  z.literal("manager"),
  z.literal("cashier"),
  z.literal("user"),
]);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Permission types for dashboard and feature access.
 */
export const permissionSchema = z.union([
  z.literal("dashboard:read"),
  z.literal("dashboard:write"),
  z.literal("dashboard:analytics"),
  z.literal("users:read"),
  z.literal("users:write"),
  z.literal("users:delete"),
  z.literal("settings:read"),
  z.literal("settings:write"),
  z.literal("tasks:read"),
  z.literal("tasks:write"),
  z.literal("tasks:delete"),
  z.literal("apps:read"),
  z.literal("apps:write"),
  z.literal("chats:read"),
  z.literal("chats:write"),
  z.literal("reports:read"),
  z.literal("reports:write"),
]);
export type Permission = z.infer<typeof permissionSchema>;

/**
 * Role hierarchy for comparison.
 * Higher numeric values inherit permissions from lower roles.
 */
export const roleHierarchy: Record<UserRole, number> = {
  user: 0,
  cashier: 1,
  manager: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Permission mapping for each role.
 * Each role inherits all permissions from lower roles.
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    "dashboard:read",
    "dashboard:write",
    "dashboard:analytics",
    "users:read",
    "users:write",
    "users:delete",
    "settings:read",
    "settings:write",
    "tasks:read",
    "tasks:write",
    "tasks:delete",
    "apps:read",
    "apps:write",
    "chats:read",
    "chats:write",
    "reports:read",
    "reports:write",
  ],
  admin: [
    "dashboard:read",
    "dashboard:write",
    "dashboard:analytics",
    "users:read",
    "users:write",
    "settings:read",
    "settings:write",
    "tasks:read",
    "tasks:write",
    "apps:read",
    "apps:write",
    "chats:read",
    "chats:write",
    "reports:read",
    "reports:write",
  ],
  manager: [
    "dashboard:read",
    "dashboard:analytics",
    "users:read",
    "settings:read",
    "tasks:read",
    "tasks:write",
    "apps:read",
    "chats:read",
    "chats:write",
    "reports:read",
  ],
  cashier: [
    "dashboard:read",
    "tasks:read",
    "tasks:write",
    "apps:read",
    "chats:read",
    "chats:write",
  ],
  user: ["dashboard:read", "tasks:read", "apps:read", "chats:read", "chats:write"],
};

/**
 * Gets all permissions for a given role.
 * Includes inherited permissions from lower roles.
 *
 * @param role - User role to get permissions for
 * @returns Array of permissions
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Checks if a role has a specific permission.
 *
 * @param role - User role to check
 * @param permission - Permission to verify
 * @returns True if role has the permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getPermissions(role);
  return permissions.includes(permission);
}

/**
 * Checks if a user role meets the minimum required role.
 *
 * @param userRole - User's current role
 * @param requiredRole - Minimum required role
 * @returns True if user meets or exceeds the required role
 */
export function meetsRoleRequirement(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Dashboard view types for different user roles.
 */
export const dashboardViewSchema = z.union([
  z.literal("full"),
  z.literal("analytics"),
  z.literal("team"),
  z.literal("sales"),
  z.literal("basic"),
]);
export type DashboardView = z.infer<typeof dashboardViewSchema>;

/**
 * Maps user roles to their default dashboard view.
 */
export const roleDashboardView: Record<UserRole, DashboardView> = {
  superadmin: "full",
  admin: "full",
  manager: "team",
  cashier: "sales",
  user: "basic",
};

/**
 * Gets the default dashboard view for a role.
 *
 * @param role - User role
 * @returns Dashboard view type
 */
export function getDashboardView(role: UserRole): DashboardView {
  return roleDashboardView[role] || "basic";
}

/**
 * Checks if a role can access a specific dashboard view.
 *
 * @param role - User role
 * @param view - Dashboard view to access
 * @returns True if role can access the view
 */
export function canAccessDashboardView(role: UserRole, view: DashboardView): boolean {
  const userViewLevel = getViewAccessLevel(roleDashboardView[role]);
  const requiredLevel = getViewAccessLevel(view);

  return userViewLevel >= requiredLevel;
}

/**
 * Gets access level for a dashboard view.
 * Higher levels can access lower-level views.
 */
function getViewAccessLevel(view: DashboardView): number {
  const levels: Record<DashboardView, number> = {
    basic: 0,
    sales: 1,
    team: 2,
    analytics: 3,
    full: 4,
  };
  return levels[view] ?? 0;
}

/**
 * All available roles for iteration purposes.
 */
/**
 * All available roles for iteration purposes.
 */
export const ALL_ROLES: UserRole[] = ["user", "cashier", "manager", "admin", "superadmin"];

/**
 * Admin-level roles that can manage users.
 */
export const ADMIN_ROLES: UserRole[] = ["admin", "superadmin"];

/**
 * Manager-level roles that can view team analytics.
 */
export const MANAGER_ROLES: UserRole[] = ["manager", "admin", "superadmin"];

/**
 * Check if a role is an admin role.
 */
export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Check if a role is a manager role or higher.
 */
export function isManagerRole(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role);
}