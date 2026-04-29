/**
 * Custom hook that synchronizes Better Auth session with TanStack Store auth store.
 * This ensures that our centralized state management stays in sync with
 * the actual authentication state from Better Auth.
 */

import { useEffect } from "react";
import { useSession } from "~/lib/auth/client";
import { authActions } from "~/lib/stores/auth";

/**
 * Hook that keeps auth store in sync with Better Auth session.
 * Should be used at the root level of the application.
 */
export function useAuthSync() {
  const { data: session, isPending, error } = useSession();

  // Sync session changes to auth store
  useEffect(() => {
    if (isPending) {
      // We're still loading, don't update store yet
      return;
    }

    if (error) {
      // Error occurred, reset auth state
      authActions.reset();
      return;
    }

    if (session) {
      // Update auth store with session data
      // Based on Better Auth types from testing, session has: session (with id, expiresAt) and user
      const mappedSession = {
        user: session.user ? { ...session.user, image: session.user.image ?? undefined } : null,
        expiresAt: session.session?.expiresAt ?? null,
        id: session.session?.id ?? "",
        token: session.session?.token ?? "",
        ipAddress: session.session?.ipAddress ?? undefined,
        userAgent: session.session?.userAgent ?? undefined,
        createdAt: session.session?.createdAt ?? undefined,
        updatedAt: session.session?.updatedAt ?? undefined,
      };

      authActions.setSession(mappedSession);
      authActions.setUser(
        session.user ? { ...session.user, image: session.user.image ?? undefined } : null,
      );
      authActions.setAccessToken(session.session?.token ?? "");
    } else {
      // No session, clear auth state
      authActions.reset();
    }
  }, [session, isPending, error]);

  return { session, isPending, error };
}