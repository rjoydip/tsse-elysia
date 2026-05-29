/**
 * Unit tests for modular API route plugins.
 * Verifies each Elysia route module exposes the expected endpoints and payloads
 * when mounted as an isolated plugin (bypassing the full app assembly in -app.ts).
 *
 * These complement health.test.ts: modules.test.ts validates individual plugins
 * work correctly in isolation, while health.test.ts validates the full assembled
 * app stack end-to-end. Keeping them separate catches regressions in both the
 * plugin wiring and the app assembly layer.
 */

import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { APP_NAME } from "~/config";
import { coreRoutes } from "~/routes/api/root/-core";
import { realtimeRoutes } from "~/routes/api/root/-realtime";
import { databaseRoutes } from "~/routes/api/root/-database";

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
    const data = (await response.json()) as {
      websocketEndpoint: string;
      requiresAuth: boolean;
    };
    expect(data.websocketEndpoint).toBe("/api/ws");
    expect(data.requiresAuth).toBe(true);
  });

  it("should return realtime health payload", async () => {
    const response = await app.handle(new Request("http://localhost/api/realtime/health"));

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      status: string;
      websocketPath: string;
    };
    expect(data.status).toBe("healthy");
    expect(data.websocketPath).toBe("/api/ws");
  });
});

describe("Database API module", () => {
  const app = new Elysia({ prefix: "/api" }).use(databaseRoutes);

  it("should return database heartbeat payload", async () => {
    const response = await app.handle(new Request("http://localhost/api/database/heartbeat"));

    expect([200, 503]).toContain(response.status);
    const data = (await response.json()) as {
      status: string;
      timestamp: string;
      detail: string;
    };
    expect(["healthy", "unhealthy"]).toContain(data.status);
    expect(typeof data.timestamp).toBe("string");
    expect(typeof data.detail).toBe("string");
  });
});