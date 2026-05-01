/**
 * Auth Guard Component
 * Protects routes by checking authentication status.
 * Redirects unauthenticated users to the login page.
 * Shows loading state while checking auth.
 */

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "~/lib/auth/client";
import { ErrorDisplay } from "~/components/ui/error-display";

/**
 * Props for the AuthGuard component.
 * @property children - Content to Render when authenticated
 * @property fallback - Optional redirect path for unauthenticated users (defaults to /auth/login)
 */
export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: string;
}

/**
 * AuthGuard component that wraps protected content.
 * Checks session status and redirects if not authenticated.
 * Displays a loading spinner while authentication state is being determined.
 *
 * @example
 * // Protect a page
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 *
 * // Custom redirect path
 * <AuthGuard fallback="/custom-login">
 *   <ProtectedContent />
 * </AuthGuard>
 */
export function AuthGuard({ children, fallback = "/sign-in" }: AuthGuardProps) {
  const { data: session, isPending, error } = useSession();
  const navigate = useNavigate();

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!isPending && !session && !error) {
      navigate({ to: fallback });
    }
  }, [session, isPending, error, navigate, fallback]);

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          {/* Loading spinner */}
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state if session fetch failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorDisplay message={error.message || "Failed to verify authentication"}>
          <button
            onClick={() => navigate({ to: fallback })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </ErrorDisplay>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!session) {
    return null;
  }

  // Render protected content when authenticated
  return <>{children}</>;
}