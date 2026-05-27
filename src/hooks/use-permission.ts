/**
 * Permission Hook for Client-Side Access Control
 * Provides reactive permission checking based on user session/role.
 */

import { useSession } from "~/lib/auth/client";
import { useAuthStore, getUserRoleFromCookie } from "~/lib/stores/auth";
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
 * Extracts user role from auth store or cookie.
 * Auth store has priority as it contains the role set during admin sign-in.
 * Falls back to reading directly from cookie to handle initial load timing.
 */
function getUserRole(authState: { user: { role?: string[] } | null }): UserRole {
  if (authState.user?.role && authState.user.role.length > 0) {
    const role = authState.user.role[0];
    if (isValidRole(role)) {
      return role;
    }
  }

  return getUserRoleFromCookie();
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
  dashboardView: DashboardView | null;
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
  const authState = useAuthStore();
  const { data: session, isPending: sessionPending } = useSession();

  // The auth store (populated from cookie) may lag behind the Better Auth
  // session. If the session has resolved with a user but the store hasn't
  // been updated yet via authActions.setSession(), keep loading to prevent
  // a flash of the wrong dashboard (e.g., user/basic dashboard before admin).
  const storeHasUser = Boolean(authState.user);
  const sessionHasUser = Boolean(session?.user);
  const isPending = sessionPending || (sessionHasUser && !storeHasUser);

  // Only resolve the role when both session and store are consistent
  const role = isPending ? ("user" as UserRole) : getUserRole(authState);
  const isAuthenticated = Boolean(session?.user) || Boolean(authState.user);

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