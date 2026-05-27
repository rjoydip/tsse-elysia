/**
 * Custom hook that synchronizes Better Auth session with TanStack Store auth store.
 * This ensures that our centralized state management stays in sync with
 * the actual authentication state from Better Auth.
 */

import { useEffect, useRef } from "react";
import { useSession } from "~/lib/auth/client";
import { authActions } from "~/lib/stores/auth";

/**
 * Builds a mapped session object from a user record and the current session.
 * Extracted to a helper to avoid duplication between the try and catch branches.
 *
 * @param user - The user record (possibly enriched with role)
 * @param session - The current Better Auth session
 * @returns A mapped session object compatible with the auth store
 */
function buildMappedSession(
  user: Record<string, unknown>,
  session: NonNullable<ReturnType<typeof useSession>["data"]>,
) {
  return {
    user,
    expiresAt: session.session?.expiresAt ?? null,
    id: session.session?.id ?? "",
    token: session.session?.token ?? "",
    ipAddress: session.session?.ipAddress ?? undefined,
    userAgent: session.session?.userAgent ?? undefined,
    createdAt: session.session?.createdAt ?? undefined,
    updatedAt: session.session?.updatedAt ?? undefined,
  };
}

/**
 * Hook that keeps auth store in sync with Better Auth session.
 * Should be used at the root level of the application.
 */
export function useAuthSync() {
  const { data: session, isPending, error } = useSession();
  // Track the last synced session ID to deduplicate React StrictMode
  // double-invocations in development.
  const syncedSessionId = useRef<string | null>(null);

  // Sync session changes to auth store
  useEffect(() => {
    if (isPending) {
      return;
    }

    if (error) {
      authActions.reset();
      return;
    }

    if (session?.user) {
      // Skip if we already synced this session (prevents duplicate calls
      // from React StrictMode double-mounting in development)
      const sessionId = session.session?.id ?? session.user.id;
      if (syncedSessionId.current === sessionId) {
        return;
      }
      syncedSessionId.current = sessionId;

      // Fetch user role from our database to preserve custom role.
      // We must resolve the role BEFORE updating the auth store, otherwise
      // the store's user object will temporarily lack the role array and
      // cause a flash of the wrong dashboard (e.g., "basic" before "full").
      const syncSession = async () => {
        try {
          const res = await fetch("/api/users/me", { credentials: "include" });
          let enrichedUser: Record<string, unknown>;

          if (res.ok) {
            const userData = await res.json();
            const role = userData?.role || "user";
            enrichedUser = {
              ...session.user,
              image: session.user.image ?? undefined,
              role: [role],
            };
          } else {
            enrichedUser = {
              ...session.user,
              image: session.user.image ?? undefined,
            };
          }

          const mappedSession = buildMappedSession(enrichedUser, session);
          authActions.setSession(mappedSession);
          authActions.setAccessToken(session.session?.token ?? "");
        } catch {
          const fallbackUser = {
            ...session.user,
            image: session.user.image ?? undefined,
          };
          const mappedSession = buildMappedSession(fallbackUser, session);
          authActions.setSession(mappedSession);
          authActions.setAccessToken(session.session?.token ?? "");
        }
      };

      syncSession();
    } else if (!session) {
      // Clear synced ref so a future login session will re-sync
      syncedSessionId.current = null;
      authActions.reset();
    }
  }, [session, isPending, error]);

  return { session, isPending, error };
}