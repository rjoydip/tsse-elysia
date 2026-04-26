/**
 * Unit tests for auth store sync functionality
 */

import { describe, expect, it, beforeEach } from "bun:test";
import { authStore, authActions } from "../../../src/lib/stores/auth";

describe("Auth Store Sync", () => {
  beforeEach(() => {
    authActions.reset();
  });

  describe("Auth Store Actions", () => {
    it("should set session with user", () => {
      const sessionData = {
        user: { id: "user-456", email: "admin@example.com" },
        id: "session-456",
        token: "token-456",
        expiresAt: new Date().toISOString(),
      } as any;

      authActions.setSession(sessionData);

      expect(authStore.get().user?.email).toBe("admin@example.com");
      expect(authStore.get().accessToken).toBe("token-456");
    });

    it("should reset store completely", () => {
      authActions.setUser({ accountNo: "123", email: "test@test.com", role: ["user"] });
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