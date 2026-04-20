/**
 * Unit tests for modular API route plugins.
 * Verifies each Elysia route module exposes the expected endpoints and payloads.
 */

import { describe, expect, it, afterEach } from "bun:test";
import { Elysia } from "elysia";
import { APP_NAME } from "../../../src/config";
import { coreRoutes } from "../../../src/routes/api/modules/-core";
import { realtimeRoutes } from "../../../src/routes/api/modules/-realtime";
import { databaseRoutes } from "../../../src/routes/api/modules/-database";
import { cacheRoutes } from "../../../src/routes/api/modules/-cache";
import { closeStorage } from "../../../src/lib/cache";

describe("Core API module", () => {
  const app = new Elysia({ prefix: "/api" }).use(coreRoutes);

  it("should return root welcome message", async () => {
    const response = await app.handle(new Request("http://localhost/api"));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe(`Welcome to ${APP_NAME} Service`);
  });

  it("should return healthy status payload", async () => {
    const response = await app.handle(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    const data = (await response.json()) as { status: string; name: string };
    expect(data.status).toBe("healthy");
    expect(data.name).toBe(APP_NAME);
  });
});

describe("Realtime API module", () => {
  const app = new Elysia({ prefix: "/api" }).use(realtimeRoutes);

  it("should return realtime discovery metadata", async () => {
    const response = await app.handle(new Request("http://localhost/api/realtime"));

    expect(response.status).toBe(200);
    const data = (await response.json()) as { websocketEndpoint: string; requiresAuth: boolean };
    expect(data.websocketEndpoint).toBe("/api/ws");
    expect(data.requiresAuth).toBe(true);
  });

  it("should return realtime health payload", async () => {
    const response = await app.handle(new Request("http://localhost/api/realtime/health"));

    expect(response.status).toBe(200);
    const data = (await response.json()) as { status: string; websocketPath: string };
    expect(data.status).toBe("healthy");
    expect(data.websocketPath).toBe("/api/ws");
  });
});

describe("Database API module", () => {
  const app = new Elysia({ prefix: "/api" }).use(databaseRoutes);

  it("should return database heartbeat payload", async () => {
    const response = await app.handle(new Request("http://localhost/api/database/heartbeat"));

    expect([200, 503]).toContain(response.status);
    const data = (await response.json()) as { status: string; timestamp: string; detail: string };
    expect(["healthy", "unhealthy"]).toContain(data.status);
    expect(typeof data.timestamp).toBe("string");
    expect(typeof data.detail).toBe("string");
  });
});

describe("Cache API module", () => {
  const app = new Elysia({ prefix: "/api" }).use(cacheRoutes);

  afterEach(() => {
    closeStorage();
  });

  it("should return cache heartbeat payload", async () => {
    const response = await app.handle(new Request("http://localhost/api/cache/heartbeat"));

    expect([200, 503]).toContain(response.status);
    const data = (await response.json()) as {
      status: string;
      timestamp: string;
      backend: string;
      latencyMs: number;
    };
    expect(["healthy", "unhealthy"]).toContain(data.status);
    expect(typeof data.timestamp).toBe("string");
    expect(["redis", "lru", "postgres"]).toContain(data.backend);
    expect(typeof data.latencyMs).toBe("number");
  });

  it("should return latency measurement", async () => {
    const response = await app.handle(new Request("http://localhost/api/cache/heartbeat"));
    const data = (await response.json()) as { latencyMs: number };

    expect(data.latencyMs).toBeGreaterThanOrEqual(0);
  });
});