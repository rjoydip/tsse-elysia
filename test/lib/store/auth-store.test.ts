import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { authStore, authActions } from "../../../src/lib/stores/auth-store";

describe("Auth Store", () => {
  beforeEach(() => {
    authActions.reset();
  });

  afterEach(() => {
    authActions.reset();
  });

  describe("Initial State", () => {
    it("should have null user initially", () => {
      expect(authStore.get().user).toBeNull();
    });

    it("should have empty accessToken initially", () => {
      expect(authStore.get().accessToken).toBe("");
    });
  });

  describe("setUser", () => {
    it("should set user correctly", () => {
      const testUser = {
        accountNo: "12345",
        email: "test@example.com",
        role: ["user"],
        exp: Date.now() + 3600000,
      };

      authActions.setUser(testUser);
      expect(authStore.get().user?.email).toBe("test@example.com");
    });
  });

  describe("setAccessToken", () => {
    it("should set access token", () => {
      authActions.setAccessToken("test-token");
      expect(authStore.get().accessToken).toBe("test-token");
    });
  });

  describe("reset", () => {
    it("should clear all auth state", () => {
      authActions.setUser({ email: "test@test.com" });
      authActions.setAccessToken("token");

      authActions.reset();

      expect(authStore.get().user).toBeNull();
      expect(authStore.get().accessToken).toBe("");
    });
  });
});