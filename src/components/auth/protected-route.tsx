/**
 * Protected Route Component
 * Provides role-based access control for route protection.
 * Renders children only if user has the required role(s).
 */

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "~/lib/auth/client";
import type { UserRole, Permission } from "~/lib/auth/permissions";
import { hasPermission, meetsRoleRequirement } from "~/lib/auth/permissions";

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
 * Props for ProtectedRoute component.
 */
export interface ProtectedRouteProps {
  /** Content to render when authorized */
  children: React.ReactNode;
  /** Single role or array of roles that can access this route */
  roles?: UserRole[] | UserRole;
  /** Specific permission required for access */
  permission?: Permission;
  /** Minimum role level required (checks hierarchy) */
  minRole?: UserRole;
  /** Redirect path for unauthorized users (default: /unauthorized) */
  fallback?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom unauthorized component */
  unauthorizedComponent?: React.ReactNode;
  /** If true, redirects to login instead of unauthorized (for unauthenticated access) */
  requireAuth?: boolean;
}

/**
 * ProtectedRoute component that enforces role-based access control.
 * Use this to wrap any content that should only be accessible to certain users.
 *
 * @example
 * // Require admin role
 * <ProtectedRoute roles="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * // Require any of multiple roles
 * <ProtectedRoute roles={["admin", "manager"]}>
 *   <ManagementPanel />
 * </ProtectedRoute>
 *
 * // Require minimum role level
 * <ProtectedRoute minRole="manager">
 *   <ManagerDashboard />
 * </ProtectedRoute>
 *
 * // Require specific permission
 * <ProtectedRoute permission="dashboard:analytics">
 *   <AnalyticsPanel />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  roles,
  permission,
  minRole,
  fallback = "/403",
  loadingComponent,
  unauthorizedComponent,
  requireAuth = true,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  const userRole = getUserRole(session);
  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    if (isPending) return;

    if (requireAuth && !isAuthenticated) {
      navigate({ to: "/sign-in", search: { redirect: "/" }, replace: true });
      return;
    }

    const isAuthorized = checkAuthorization(userRole, roles, permission, minRole);
    if (!isAuthorized) {
      navigate({ to: fallback, replace: true });
    }
  }, [
    session,
    isPending,
    navigate,
    fallback,
    roles,
    permission,
    minRole,
    userRole,
    isAuthenticated,
    requireAuth,
  ]);

  if (isPending) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Checking permissions...</p>
          </div>
        </div>
      )
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
          </div>
        </div>
      )
    );
  }

  const isAuthorized = checkAuthorization(userRole, roles, permission, minRole);

  if (!isAuthorized) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground max-w-md">
            You do not have permission to access this content.
            {minRole && <span className="block mt-1">Required role: {minRole} or higher</span>}
            {roles && (
              <span className="block mt-1">
                Required roles: {Array.isArray(roles) ? roles.join(", ") : roles}
              </span>
            )}
            {permission && <span className="block mt-1">Required permission: {permission}</span>}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate({ to: fallback })}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Checks if user is authorized based on role, permission, or minRole requirements.
 */
function checkAuthorization(
  userRole: UserRole,
  roles?: UserRole[] | UserRole,
  permission?: Permission,
  minRole?: UserRole,
): boolean {
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(userRole)) {
      return false;
    }
  }

  if (minRole) {
    if (!meetsRoleRequirement(userRole, minRole)) {
      return false;
    }
  }

  if (permission) {
    if (!hasPermission(userRole, permission)) {
      return false;
    }
  }

  return true;
}

/**
 * Props for Can component - conditional rendering based on permissions.
 */
export interface CanProps {
  /** Content to render when authorized */
  children: React.ReactNode;
  /** Role(s) that can see this content */
  roles?: UserRole[] | UserRole;
  /** Permission required to see this content */
  permission?: Permission;
  /** Minimum role level required */
  minRole?: UserRole;
  /** Content to render when NOT authorized (optional) */
  fallback?: React.ReactNode;
}

/**
 * Can component for conditional rendering based on permissions.
 * Renders children if user is authorized, otherwise renders fallback.
 *
 * @example
 * <Can permission="dashboard:write">
 *   <AddWidgetButton />
 * </Can>
 *
 * <Can roles="admin">
 *   <AdminPanel />
 *   < fallback={<UserPanel />} />
 * </Can>
 */
export function Can({ children, roles, permission, minRole, fallback = null }: CanProps) {
  const { data: session } = useSession();
  const userRole = getUserRole(session);

  const isAuthorized = checkAuthorization(userRole, roles, permission, minRole);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}