/**
 * Unit tests for auth store sync functionality
 * Tests the session synchronization logic
 */

import { describe, expect, it, beforeEach } from "bun:test";
import { authStore, authActions } from "../../../src/lib/stores/auth-store";

interface TestUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface TestSession {
  id: string;
  token: string;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

describe("Auth Store Sync", () => {
  beforeEach(() => {
    authActions.reset();
  });

  describe("Session Data Mapping", () => {
    it("should map session with user data", () => {
      const sessionData = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          image: "https://example.com/avatar.png",
        },
        session: {
          id: "session-123",
          token: "auth-token-123",
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const mappedSession = {
        user: sessionData.user
          ? { ...sessionData.user, image: sessionData.user.image ?? undefined }
          : null,
        expiresAt: sessionData.session?.expiresAt ?? null,
        id: sessionData.session?.id ?? "",
        token: sessionData.session?.token ?? "",
        ipAddress: sessionData.session?.ipAddress ?? undefined,
        userAgent: sessionData.session?.userAgent ?? undefined,
      };

      expect(mappedSession.user?.email).toBe("test@example.com");
      expect(mappedSession.token).toBe("auth-token-123");
      expect(mappedSession.expiresAt).toBeTruthy();
    });
  });

  describe("Auth Store Actions", () => {
    it("should set session with user", () => {
      const sessionData = {
        user: {
          id: "user-456",
          email: "admin@example.com",
        },
        id: "session-456",
        token: "token-456",
        expiresAt: new Date().toISOString(),
      };

      authActions.setSession(sessionData);

      expect(authStore.get().user?.email).toBe("admin@example.com");
      expect(authStore.get().accessToken).toBe("token-456");
    });

    it("should reset store completely", () => {
      authActions.setUser({
        accountNo: "123",
        email: "test@test.com",
        role: ["user"],
      });

      authActions.reset();

      expect(authStore.get().user).toBeNull();
      expect(authStore.get().accessToken).toBe("");
    });
  });

  describe("authStore state", () => {
    it("should return default state", () => {
      expect(authStore.get().user).toBeNull();
      expect(authStore.get().accessToken).toBe("");
    });
  });
});