/**
 * E2E tests for Cache API endpoints
 * Tests: /api/cache/heartbeat endpoint with live server
 */

import { test, expect } from "@playwright/test";

test.describe("Cache API Endpoints", () => {
  test("should return cache heartbeat payload", async ({ request }) => {
    const response = await request.get("/api/cache/heartbeat");

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("connected");
    expect(body).toHaveProperty("url");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("backend");
    expect(body).toHaveProperty("latencyMs");
  });

  test("should return healthy status when cache is connected", async ({ request }) => {
    const response = await request.get("/api/cache/heartbeat");
    const body = await response.json();

    expect(body.status).toBe("healthy");
    expect(body.connected).toBe(true);
  });

  test("should return valid backend type", async ({ request }) => {
    const response = await request.get("/api/cache/heartbeat");
    const body = await response.json();

    expect(["redis", "lru", "postgres"]).toContain(body.backend);
  });

  test("should include latency measurement", async ({ request }) => {
    const response = await request.get("/api/cache/heartbeat");
    const body = await response.json();

    expect(typeof body.latencyMs).toBe("number");
    expect(body.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test("should return JSON content-type", async ({ request }) => {
    const response = await request.get("/api/cache/heartbeat");

    const headers = response.headers();
    expect(headers["content-type"]).toBe("application/json");
  });

  test("should mask URL credentials", async ({ request }) => {
    const response = await request.get("/api/cache/heartbeat");
    const body = await response.json();

    expect(body.url).toContain(":***@");
  });
});