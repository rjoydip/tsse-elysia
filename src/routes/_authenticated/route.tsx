import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthenticatedLayout } from "~/components/layout/authenticated-layout";
import { useAuthStore } from "~/lib/stores/auth";
import { useSession } from "~/lib/auth/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedRouteWrapper,
});

function AuthenticatedRouteWrapper() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    // Wait for session to finish loading
    if (isPending) return;

    // Check if authenticated (session exists OR store has token)
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