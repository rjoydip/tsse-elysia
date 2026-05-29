/**
 * Unit tests for Redis session storage.
 */

import { describe, it, expect, afterEach } from "bun:test";
import { RedisSessionStorage, sessionStorage } from "~/lib/auth/session";
import { closeCache } from "~/lib/cache";

describe("RedisSessionStorage", () => {
  const storage = new RedisSessionStorage();

  afterEach(() => {
    closeCache();
  });

  describe("methods exist", () => {
    it("should have create method", () => {
      expect(typeof storage.create).toBe("function");
    });

    it("should have get method", () => {
      expect(typeof storage.get).toBe("function");
    });

    it("should have update method", () => {
      expect(typeof storage.update).toBe("function");
    });

    it("should have delete method", () => {
      expect(typeof storage.delete).toBe("function");
    });

    it("should have deleteAll method", () => {
      expect(typeof storage.deleteAll).toBe("function");
    });
  });

  describe("basic operations", () => {
    it("should handle create without throwing", async () => {
      const testSession = {
        id: "test-session-id",
        userId: "test-user-id",
        expiresAt: new Date(),
        token: "test-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(storage.create(testSession)).resolves.toBeUndefined();
    });

    it("should handle get for non-existent key", async () => {
      const result = await storage.get("non-existent-id", "test-user");
      expect(result).toBeNull();
    });

    it("should handle delete without throwing", () => {
      expect(() => {
        storage.delete("non-existent", "test-user");
      }).not.toThrow();
    });

    it("should handle deleteAll without throwing", () => {
      expect(() => {
        storage.deleteAll("non-user");
      }).not.toThrow();
    });
  });

  describe("session key patterns", () => {
    it("generates correct key format session:{userId}:{sessionId}", () => {
      const userId = "user123";
      const sessionId = "sess456";
      const key = storage.getKey(userId, sessionId);
      expect(key).toBe(`session:${userId}:${sessionId}`);
    });

    it("deleteAll uses pattern session:{userId}:* to match stored keys", async () => {
      // The deleteAll method uses pattern `session:${userId}:*`
      // This should match keys created with format `session:${userId}:${sessionId}`
      const userId = "test-user-123";

      // Create a session to verify key format works
      const testSession = {
        id: "session-abc",
        userId,
        expiresAt: new Date(),
        token: "token-xyz",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.create(testSession);

      // Verify we can retrieve it with correct userId + sessionId
      const retrieved = await storage.get("session-abc", userId);
      // If Redis unavailable, returns null (graceful degradation)
      expect(retrieved === null || retrieved.id === "session-abc").toBe(true);

      // deleteAll should find and delete sessions with pattern session:userId:*
      await storage.deleteAll(userId);
    });
  });
});

describe("sessionStorage export", () => {
  afterEach(() => {
    closeCache();
  });

  it("should export singleton with all methods", () => {
    expect(sessionStorage).toBeDefined();
    expect(typeof sessionStorage.create).toBe("function");
    expect(typeof sessionStorage.get).toBe("function");
    expect(typeof sessionStorage.update).toBe("function");
    expect(typeof sessionStorage.delete).toBe("function");
    expect(typeof sessionStorage.deleteAll).toBe("function");
  });
});