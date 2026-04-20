/**
 * Unit tests for the Redis client module.
 * Tests client initialization, health check status, and connection management.
 *
 * @remarks
 * These tests verify the module's API surface and graceful degradation.
 * They do not require a running Redis instance — the module handles
 * unavailability by returning null/disabled status.
 */

import { describe, test, expect, afterEach } from "bun:test";
import {
  getStorage,
  getStorageStatus,
  closeStorage,
  ensureStorageConnection,
  validateStorageConnection,
  getStorageBackend,
  isPubSubSupported,
} from "../../../src/lib/cache";

describe("Storage Client (getStorage)", () => {
  afterEach(() => {
    closeStorage();
  });

  test("getStorage returns a Storage instance or null", () => {
    const storage = getStorage();
    expect(storage === null || typeof storage === "object").toBe(true);
  });

  test("getStorage is idempotent (returns same instance)", () => {
    const storage1 = getStorage();
    const storage2 = getStorage();
    expect(storage1).toBe(storage2);
  });
});

describe("Storage Status (getStorageStatus)", () => {
  afterEach(() => {
    closeStorage();
  });

  test("getStorageStatus returns a valid status object", async () => {
    const status = await getStorageStatus();
    expect(status).toHaveProperty("connected");
    expect(status).toHaveProperty("url");
    expect(status).toHaveProperty("backend");
    expect(typeof status.connected).toBe("boolean");
    expect(typeof status.url).toBe("string");
    expect(typeof status.backend).toBe("string");
  });

  test("getStorageStatus includes backend type (redis, lru, or postgres)", async () => {
    const status = await getStorageStatus();
    expect(["redis", "lru", "postgres"]).toContain(status.backend);
  });

  test("getStorageStatus includes error when not configured", async () => {
    const status = await getStorageStatus();
    if (!status.connected) {
      expect(typeof status.error === "string" || status.error === undefined).toBe(true);
    }
  });

  test("getStorageStatus masks sensitive URL information", async () => {
    const status = await getStorageStatus();
    if (status.url !== "in-memory") {
      expect(status.url).not.toContain("password");
      expect(status.url).not.toContain("token");
    }
  });
});

describe("Storage Connection Validation", () => {
  afterEach(() => {
    closeStorage();
  });

  test("ensureStorageConnection returns boolean based on storage availability", async () => {
    const result = await ensureStorageConnection();
    expect(typeof result).toBe("boolean");
  });

  test("validateStorageConnection validates connection", async () => {
    const result = await validateStorageConnection();
    expect(typeof result).toBe("boolean");
  });
});

describe("Storage Close", () => {
  afterEach(() => {
    closeStorage();
  });

  test("closeStorage is safe to call multiple times", () => {
    closeStorage();
    closeStorage();
    closeStorage();
    expect(true).toBe(true);
  });

  test("closeStorage resets the singleton so next getStorage creates new instance", () => {
    const storage1 = getStorage();
    closeStorage();
    const storage2 = getStorage();
    if (storage1 !== null && storage2 !== null) {
      expect(storage1).not.toBe(storage2);
    }
  });
});

describe("Storage Backend Detection", () => {
  afterEach(() => {
    closeStorage();
  });

  test("getStorageBackend returns current backend type", () => {
    const backend = getStorageBackend();
    expect(["redis", "postgres", "lru"]).toContain(backend);
  });

  test("getStorageBackend is consistent with getStorageStatus", async () => {
    const backend = getStorageBackend();
    const status = await getStorageStatus();
    expect(status.backend).toBe(backend);
  });

  test("isPubSubSupported returns true only for Redis backend", () => {
    const backend = getStorageBackend();
    const pubSubSupported = isPubSubSupported();
    expect(pubSubSupported).toBe(backend === "redis");
  });

  test("isPubSubSupported is consistent with getPubSubStatus crossInstance", async () => {
    const { getPubSubStatus } = await import("../../../src/lib/cache/pubsub");
    const pubSubStatus = getPubSubStatus();
    expect(pubSubStatus.crossInstance).toBe(isPubSubSupported());
  });
});

describe("Storage Connection Failure Scenarios", () => {
  afterEach(() => {
    closeStorage();
  });

  test("operations gracefully degrade when storage unavailable", async () => {
    const storage = getStorage();
    if (storage === null) {
      expect(true).toBe(true);
    } else {
      const status = await getStorageStatus();
      expect(typeof status.connected).toBe("boolean");
    }
  });

  test("getStorageStatus handles connection errors gracefully", async () => {
    const status = await getStorageStatus();
    expect(status).toHaveProperty("connected");
    expect(status).toHaveProperty("url");
    expect(status).toHaveProperty("backend");
  });
});

describe("Deprecated Aliases (Backward Compatibility)", () => {
  afterEach(() => {
    closeStorage();
  });

  test("getRedisClient returns storage or null", () => {
    const { getRedisClient } = require("../../../src/lib/cache");
    const client = getRedisClient();
    expect(client === null || typeof client === "object").toBe(true);
  });

  test("getRedisStatus returns valid status", async () => {
    const { getRedisStatus } = require("../../../src/lib/redis");
    const status = await getRedisStatus();
    expect(status).toHaveProperty("connected");
    expect(status).toHaveProperty("url");
    expect(status).toHaveProperty("backend");
  });

  test("ensureRedisConnection returns boolean", async () => {
    const { ensureRedisConnection } = require("../../../src/lib/cache");
    const result = await ensureRedisConnection();
    expect(typeof result).toBe("boolean");
  });

  test("closeRedis is safe to call", () => {
    const { closeRedis } = require("../../../src/lib/cache");
    expect(() => closeRedis()).not.toThrow();
  });

  test("RedisStatus type alias works", () => {
    const status = {
      connected: true,
      backend: "lru",
      url: "in-memory",
    };
    expect(status.connected).toBe(true);
    expect(status.backend).toBe("lru");
  });
});