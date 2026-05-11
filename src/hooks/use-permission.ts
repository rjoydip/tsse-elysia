/**
 * Permission Hook for Client-Side Access Control
 * Provides reactive permission checking based on user session/role.
 */

import { useSession } from "~/lib/auth/client";
import type { UserRole, Permission } from "~/lib/auth/permissions";
import {
  hasPermission,
  meetsRoleRequirement,
  getPermissions,
  isAdminRole,
  isManagerRole,
  getDashboardView,
  type DashboardView,
} from "~/lib/auth/permissions";

/**
 * Extracts user role from session data.
 */
function getUserRole(session: unknown): UserRole {
  if (session && typeof session === "object" && "user" in session) {
    const user = (session as { user?: { role?: string } }).user;
    if (user?.role && isValidRole(user.role)) {
      return user.role as UserRole;
    }
  }
  return "user";
}

/**
 * Type guard to check if a string is a valid role.
 */
function isValidRole(role: string): role is UserRole {
  return ["superadmin", "admin", "manager", "cashier", "user"].includes(role);
}

/**
 * Return type for usePermission hook.
 */
export interface UsePermissionReturn {
  /** Current user role */
  role: UserRole;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the user has a specific permission */
  can: (permission: Permission) => boolean;
  /** Whether the user has a specific role */
  hasRole: (role: UserRole) => boolean;
  /** Whether the user meets or exceeds the minimum role requirement */
  hasMinRole: (minRole: UserRole) => boolean;
  /** All permissions the current user has */
  permissions: Permission[];
  /** Whether user is an admin (admin or superadmin) */
  isAdmin: boolean;
  /** Whether user is a manager or higher */
  isManager: boolean;
  /** User's default dashboard view based on role */
  dashboardView: DashboardView;
  /** Whether loading */
  isPending: boolean;
}

/**
 * Hook for checking user permissions and role-based access.
 * Use this for conditional rendering and feature flags.
 *
 * @example
 * const { role, can, isAdmin, dashboardView } = usePermission();
 *
 * if (can('dashboard:analytics')) {
 *   return <AnalyticsPanel />;
 * }
 *
 * if (role === 'admin') {
 *   return <AdminDashboard />;
 * }
 */
export function usePermission(): UsePermissionReturn {
  const { data: session, isPending } = useSession();

  const role = getUserRole(session);
  const isAuthenticated = Boolean(session?.user);

  return {
    role,
    isAuthenticated,
    can: (permission: Permission) => hasPermission(role, permission),
    hasRole: (targetRole: UserRole) => role === targetRole,
    hasMinRole: (minRole: UserRole) => meetsRoleRequirement(role, minRole),
    permissions: getPermissions(role),
    isAdmin: isAdminRole(role),
    isManager: isManagerRole(role),
    dashboardView: getDashboardView(role),
    isPending,
  };
}

/**
 * Hook for checking if user can perform a specific action.
 * Returns a function that checks permission reactively.
 *
 * @example
 * const canWriteDashboard = useCan('dashboard:write');
 * // canWriteDashboard() returns true/false based on user role
 */
export function useCan(permission: Permission): () => boolean {
  const { role } = usePermission();
  return () => hasPermission(role, permission);
}

/**
 * Hook for checking role requirements.
 * Returns a function that checks role hierarchy reactively.
 *
 * @example
 * const checkMinRole = useMinRole('manager');
 * // checkMinRole() returns true if user is manager or higher
 */
export function useMinRole(minRole: UserRole): () => boolean {
  const { role } = usePermission();
  return () => meetsRoleRequirement(role, minRole);
}