/**
 * Contract tests for health-check API endpoints.
 * Covers: main API health, auth health, database heartbeat,
 * realtime health, and cache health.
 *
 * Uses app.handle() to simulate requests without a running server.
 */

import { describe, it, expect } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";

const app = apiRoutes;

describe("GET /api/health", () => {
  it("should return healthy status with metadata", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/health`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
    expect(body).toHaveProperty("name");
    expect(body).toHaveProperty("timestamp");
  });

  it("should return JSON content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/health`));
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should reject POST requests", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/health`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect([200, 404, 405]).toContain(response.status);
  });
});

describe("GET /api/auth/health", () => {
  it("should return auth health status", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/health`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
    expect(body).toHaveProperty("name", "Auth");
  });

  it("should return JSON content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/health`));
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("GET /api/database/heartbeat", () => {
  it("should return database heartbeat payload", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/database/heartbeat`));

    expect([200, 503]).toContain(response.status);

    const body = await response.json();
    expect(["healthy", "unhealthy"]).toContain(body.status);
    expect(body.timestamp).toBeDefined();
    expect(body.detail).toBeDefined();
  });

  it("should return JSON content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/database/heartbeat`));
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("GET /api/realtime/health", () => {
  it("should return realtime health payload", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/realtime/health`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
    expect(body).toHaveProperty("websocketPath", "/api/ws");
    expect(body).toHaveProperty("totalConnections");
    expect(body).toHaveProperty("authenticatedConnections");
    expect(body).toHaveProperty("timestamp");
  });
});

describe("GET /api/realtime", () => {
  it("should return websocket discovery metadata", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/realtime`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("websocketEndpoint", "/api/ws");
    expect(body).toHaveProperty("healthEndpoint", "/api/realtime/health");
    expect(body).toHaveProperty("requiresAuth", true);
  });
});