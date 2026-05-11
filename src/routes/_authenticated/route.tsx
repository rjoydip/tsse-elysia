/**
 * Authenticated Route Wrapper
 * Protects all routes under /dashboard/* by checking authentication and optional role requirements.
 * Redirects to sign-in if not authenticated.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthenticatedLayout } from "~/components/layout/authenticated-layout";
import { useAuthStore } from "~/lib/stores/auth";
import { useSession } from "~/lib/auth/client";
import type { UserRole } from "~/lib/auth/permissions";
import { meetsRoleRequirement } from "~/lib/auth/permissions";

/**
 * Extended route metadata for role-based access control.
 */
export interface AuthenticatedRouteMeta {
  roles?: UserRole[];
}

/**
 * Gets the authenticated route meta with optional role requirements.
 * Can be extended with additional metadata like permissions.
 */
export function getAuthenticatedRouteMeta(): AuthenticatedRouteMeta {
  return {};
}

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedRouteWrapper,
  beforeLoad: ({ context }) => {
    return context;
  },
});

/**
 * Extracts user role from session data.
 * Falls back to 'user' role if not available.
 */
function getUserRoleFromSession(session: unknown): UserRole {
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

function AuthenticatedRouteWrapper() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;

    const isAuthenticated = session?.user || authStore.accessToken;

    if (!isAuthenticated) {
      navigate({ to: "/sign-in", search: { redirect: "/" }, replace: true });
    }
  }, [session, isPending, authStore.accessToken, navigate]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = session?.user || authStore.accessToken;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <AuthenticatedLayout />;
}

/**
 * Higher-order function to create a role guard for route protection.
 * Returns a component that checks if user has required role before rendering.
 *
 * @param requiredRole - Minimum role required to access the route
 * @param WrappedComponent - Component to render if authorized
 * @returns Component with role checking
 */
export function withRoleGuard<P extends object>(
  requiredRole: UserRole,
  WrappedComponent: React.ComponentType<P>,
): React.ComponentType<P> {
  return function RoleGuardedComponent(props: P) {
    const navigate = useNavigate();
    const { data: session, isPending } = useSession();

    useEffect(() => {
      if (isPending) return;

      const userRole = getUserRoleFromSession(session);
      if (!meetsRoleRequirement(userRole, requiredRole)) {
        navigate({ to: "/403", replace: true });
      }
    }, [session, isPending, navigate, requiredRole]);

    if (isPending) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Checking permissions...</p>
          </div>
        </div>
      );
    }

    const userRole = getUserRoleFromSession(session);
    if (!meetsRoleRequirement(userRole, requiredRole)) {
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}