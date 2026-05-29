/**
 * Unit tests for Redis caching layer.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import {
  getCache,
  getCached,
  setCached,
  deleteCached,
  clearCache,
  isCached,
  cache,
  type CacheInterface,
} from "~/lib/cache";

describe("CacheInterface", () => {
  let testCache: CacheInterface;

  beforeEach(async () => {
    testCache = getCache({ namespace: "test" });
    await testCache.clear();
  });

  describe("set and get", () => {
    it("should cache a string value", async () => {
      await testCache.set("key1", "value1", 60);
      const result = await testCache.get<string>("key1");

      expect(result).toBe("value1");
    });

    it("should cache an object value", async () => {
      const data = { name: "test", count: 42 };
      await testCache.set("obj1", data, 60);
      const result = await testCache.get<typeof data>("obj1");

      expect(result).toEqual(data);
    });

    it("should return null for missing key", async () => {
      const result = await testCache.get<string>("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a cached value", async () => {
      await testCache.set("key1", "value1");
      await testCache.delete("key1");
      const result = await testCache.get<string>("key1");

      expect(result).toBeNull();
    });
  });

  describe("has", () => {
    it("should return true for existing key", async () => {
      await testCache.set("key1", "value1");
      const result = await testCache.has("key1");

      expect(result).toBe(true);
    });

    it("should return false for missing key", async () => {
      const result = await testCache.has("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("clear", () => {
    it("should clear all cached values", async () => {
      await testCache.set("key1", "value1");
      await testCache.set("key2", "value2");
      await testCache.clear();

      const result1 = await testCache.get<string>("key1");
      const result2 = await testCache.get<string>("key2");

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
});

describe("getCached/setCached", () => {
  beforeEach(async () => {
    await clearCache();
  });

  it("should get and set cached values", async () => {
    await setCached("test-key", { data: "test" }, 60);
    const result = await getCached<{ data: string }>("test-key");

    expect(result?.data).toBe("test");
  });

  it("should delete cached values", async () => {
    await setCached("test-key", "value");
    await deleteCached("test-key");
    const result = await getCached("test-key");

    expect(result).toBeNull();
  });
});

describe("isCached", () => {
  beforeEach(async () => {
    await clearCache();
  });

  it("should check if key is cached", async () => {
    await setCached("test-key", "value");
    const result = await isCached("test-key");

    expect(result).toBe(true);
  });

  it("should return false for non-cached key", async () => {
    const result = await isCached("nonexistent");

    expect(result).toBe(false);
  });
});

describe("cache export", () => {
  it("should have required methods", async () => {
    expect(cache.get).toBeDefined();
    expect(cache.set).toBeDefined();
    expect(cache.delete).toBeDefined();
    expect(cache.clear).toBeDefined();
    expect(cache.has).toBeDefined();
  });
});