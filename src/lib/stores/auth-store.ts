/**
 * Client-side authentication state management using TanStack Store.
 * Manages user session, tokens, and authentication state with cookie persistence.
 * Provides reactive auth state for React components.
 *
 * @module stores/auth-store
 */

import { createStore, useStore } from "@tanstack/react-store";
import { createEffect } from "react";
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

const authStore = createStore<AuthState>({
  user: null,
  session: null,
  accessToken: "",
});

let initialized = false;

function initAuth() {
  if (initialized) return;
  if (typeof document === "undefined") return;

  initialized = true;
  const cookieState = getCookie(ACCESS_TOKEN);
  const initToken = cookieState ? safeAtob(cookieState) : "";

  let initUser: AuthUser | null = null;
  if (cookieState) {
    try {
      const parsed = JSON.parse(cookieState);
      if (parsed && typeof parsed === "object" && "user" in parsed) {
        initUser = parsed.user || null;
      }
    } catch {
      initUser = null;
    }
  }

  authStore.setState({
    user: initUser,
    session: null,
    accessToken: initToken,
  });
}

export function useAuthInit() {
  createEffect(() => {
    initAuth();
  });
}

export const authActions = {
  setUser: (user: AuthUser | null) => {
    authStore.setState((state) => ({ ...state, user }));
  },
  setSession: (session: SessionData | null) => {
    authStore.setState((state) => ({
      ...state,
      session,
      user: session?.user || null,
      accessToken: session?.token || "",
    }));
  },
  setAccessToken: (accessToken: string) => {
    const encoded = safeBtoa(JSON.stringify(accessToken));
    setCookie(ACCESS_TOKEN, encoded);
    authStore.setState((state) => ({ ...state, accessToken }));
  },
  resetAccessToken: () => {
    removeCookie(ACCESS_TOKEN);
    authStore.setState((state) => ({ ...state, accessToken: "" }));
  },
  reset: () => {
    removeCookie(ACCESS_TOKEN);
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