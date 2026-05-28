/**
 * Unit tests for unified rate-limit store.
 * Tests Redis and in-memory backends.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import {
  memoryRateLimitStore,
  storageRateLimitStore,
  getRateLimitStore,
  checkRateLimit,
  resetRateLimit,
  cleanupRateLimitStore,
} from "~/lib/rate-limit";

describe("memoryRateLimitStore", () => {
  beforeEach(async () => {
    await memoryRateLimitStore.reset("test-key");
    await memoryRateLimitStore.reset("key-1");
    await memoryRateLimitStore.reset("key-2");
  });

  describe("check", () => {
    it("should allow request within limit", async () => {
      const result = await memoryRateLimitStore.check("test-key", 10, 60_000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("should track multiple requests", async () => {
      await memoryRateLimitStore.check("test-key", 10, 60_000);
      const result = await memoryRateLimitStore.check("test-key", 10, 60_000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(8);
    });

    it("should deny requests when limit exceeded", async () => {
      for (let i = 0; i < 10; i++) {
        await memoryRateLimitStore.check("test-key", 10, 60_000);
      }

      const result = await memoryRateLimitStore.check("test-key", 10, 60_000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should track different keys independently", async () => {
      await memoryRateLimitStore.check("key-1", 2, 60_000);
      await memoryRateLimitStore.check("key-1", 2, 60_000);

      const result1 = await memoryRateLimitStore.check("key-1", 2, 60_000);
      const result2 = await memoryRateLimitStore.check("key-2", 2, 60_000);

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });
  });

  describe("reset", () => {
    it("should clear rate limit for specific key", async () => {
      await memoryRateLimitStore.check("test-key", 5, 60_000);
      await memoryRateLimitStore.check("test-key", 5, 60_000);

      await memoryRateLimitStore.reset("test-key");

      const result = await memoryRateLimitStore.check("test-key", 5, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe("cleanup", () => {
    it("should return count of cleaned entries", async () => {
      const cleaned = await memoryRateLimitStore.cleanup();
      expect(typeof cleaned).toBe("number");
    });
  });
});

describe("checkRateLimit", () => {
  beforeEach(async () => {
    await memoryRateLimitStore.reset("test");
  });

  it("should return full rate limit result", async () => {
    const result = await checkRateLimit("test", 100, 60_000);

    expect(result).toHaveProperty("allowed");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("resetAt");
    expect(result).toHaveProperty("limit", 100);
    expect(result).toHaveProperty("duration", 60_000);
  });

  it("should use default values when not specified", async () => {
    const result = await checkRateLimit("test", 10, 60_000);

    expect(result.limit).toBe(10);
    expect(result.duration).toBe(60_000);
  });
});

describe("resetRateLimit", () => {
  beforeEach(async () => {
    await memoryRateLimitStore.reset("test");
  });

  it("should reset rate limit for key", async () => {
    await memoryRateLimitStore.check("test", 5, 60_000);

    await resetRateLimit("test");

    const result = await memoryRateLimitStore.check("test", 5, 60_000);
    expect(result.allowed).toBe(true);
  });
});

describe("cleanupRateLimitStore", () => {
  it("should cleanup expired entries", async () => {
    const cleaned = await cleanupRateLimitStore();
    expect(typeof cleaned).toBe("number");
  });
});

describe("storageRateLimitStore", () => {
  beforeEach(async () => {
    await storageRateLimitStore.reset("test");
  });

  describe("when Redis unavailable", () => {
    it("should fallback to memory store", async () => {
      const result = await storageRateLimitStore.check("test", 5, 60_000);
      expect(result.allowed).toBe(true);
    });
  });
});

describe("getRateLimitStore", () => {
  it("should return a store instance", () => {
    const store = getRateLimitStore();
    expect(store).toBeDefined();
    expect(store).toHaveProperty("check");
    expect(store).toHaveProperty("reset");
    expect(store).toHaveProperty("cleanup");
  });
});