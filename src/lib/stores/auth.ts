/**
 * Client-side authentication state management using TanStack Store.
 * Manages user session, tokens, and authentication state with cookie persistence.
 * Provides reactive auth state for React components.
 *
 * @module stores/auth
 */

import { createStore, useStore } from "@tanstack/react-store";
import { useEffect } from "react";
import { getCookie, setCookie, removeCookie } from "~/lib/cookies";

const ACCESS_TOKEN = "thisisjustarandomstring";

interface AuthUser {
  accountNo?: string;
  email?: string;
  role?: string[];
  exp?: number;
  name?: string;
  image?: string;
  createdAt?: string | Date;
  [key: string]: any;
}

interface SessionData {
  user: AuthUser | null;
  expiresAt: string | number | Date | null;
  id: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  lastActivity?: string | number | Date;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
}

interface AuthState {
  user: AuthUser | null;
  session: SessionData | null;
  accessToken: string;
}

/**
 * Base64 encoding/decoding utilities for cookie storage.
 * NOTE: This provides encoding only (not encryption) for data storage/transmission.
 * The actual security is handled by the cookie's HttpOnly/Secure flags configured
 * server-side. Do NOT rely on base64 encoding for data protection.
 */
function safeAtob(input: string): string {
  try {
    return atob(input);
  } catch {
    return "";
  }
}

function safeBtoa(input: string): string {
  try {
    return btoa(input);
  } catch {
    return btoa(unescape(encodeURIComponent(input)));
  }
}

/**
 * Get user role directly from cookie storage.
 * Used by usePermission hook to ensure role is available on initial load.
 */
export function getUserRoleFromCookie(): "user" | "admin" | "superadmin" | "manager" | "cashier" {
  const cookieState = getCookie(ACCESS_TOKEN);
  if (!cookieState) return "user";

  try {
    const parsed = JSON.parse(safeAtob(cookieState));
    if (parsed?.user?.role?.length > 0) {
      const role = parsed.user.role[0];
      if (["superadmin", "admin", "manager", "cashier", "user"].includes(role)) {
        return role as "user" | "admin" | "superadmin" | "manager" | "cashier";
      }
    }
  } catch {
    // Ignore parse errors
  }

  return "user";
}

export const authStore = createStore<AuthState>({
  user: null,
  session: null,
  accessToken: "",
});

let currentAuthState: AuthState = { user: null, session: null, accessToken: "" };

let initialized = false;
let initComplete = false;

function initAuth() {
  if (initialized) return;
  initialized = true;
  const cookieState = getCookie(ACCESS_TOKEN);

  let initUser: AuthUser | null = null;
  let initToken = "";

  if (cookieState) {
    try {
      const parsed = JSON.parse(safeAtob(cookieState));
      if (parsed && typeof parsed === "object") {
        initUser = parsed.user || null;
        initToken = parsed.token || "";
      }
    } catch {
      initUser = null;
      initToken = "";
    }
  }

  authStore.setState(() => ({
    user: initUser,
    session: null,
    accessToken: initToken,
  }));
  currentAuthState = { user: initUser, session: null, accessToken: initToken };
  initComplete = true;
}

export function useAuthInit() {
  useEffect(() => {
    initAuth();
  }, []);
}

export function useAuthInitialized(): boolean {
  return useStore(authStore, () => initComplete);
}

export const authActions = {
  setUser: (user: AuthUser | null) => {
    const token = currentAuthState.accessToken;
    const cookieValue = JSON.stringify({ user, token });
    setCookie(ACCESS_TOKEN, safeBtoa(cookieValue));
    currentAuthState = { ...currentAuthState, user };
    authStore.setState((state) => ({ ...state, user }));
  },
  setSession: (session: SessionData | null) => {
    const cookieValue = JSON.stringify({
      user: session?.user || null,
      token: session?.token || "",
    });
    setCookie(ACCESS_TOKEN, safeBtoa(cookieValue));
    currentAuthState = {
      ...currentAuthState,
      session,
      user: session?.user || null,
      accessToken: session?.token || "",
    };
    authStore.setState((state) => ({
      ...state,
      session,
      user: session?.user || null,
      accessToken: session?.token || "",
    }));
  },
  setAccessToken: (accessToken: string) => {
    const cookieValue = JSON.stringify({ user: currentAuthState.user, token: accessToken });
    setCookie(ACCESS_TOKEN, safeBtoa(cookieValue));
    currentAuthState = { ...currentAuthState, accessToken };
    authStore.setState((state) => ({ ...state, accessToken }));
  },
  resetAccessToken: () => {
    removeCookie(ACCESS_TOKEN);
    currentAuthState = { ...currentAuthState, accessToken: "" };
    authStore.setState((state) => ({ ...state, accessToken: "" }));
  },
  reset: () => {
    removeCookie(ACCESS_TOKEN);
    currentAuthState = { user: null, session: null, accessToken: "" };
    authStore.setState((state) => ({
      ...state,
      user: null,
      session: null,
      accessToken: "",
    }));
  },
};

export function useAuthStore<T = AuthState>(selector?: (state: AuthState) => T): T {
  return useStore(authStore, selector ?? ((state: AuthState) => state as unknown as T));
}