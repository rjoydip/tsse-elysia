/**
 * E2E test for the Redis heartbeat API endpoint.
 * Verifies that the status dashboard can probe Redis availability.
 */

import { test, expect } from "@playwright/test";

test.describe("Cacge Heartbeat API", () => {
  test("GET /api/cache/heartbeat returns valid response", async ({ request }) => {
    const response = await request.get("/api/cache/heartbeat");

    // Should return either 200 (healthy) or 503 (unhealthy)
    expect([200, 503]).toContain(response.status());

    const body = await response.json();

    // Response should include required fields regardless of status
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("connected");
    expect(body).toHaveProperty("url");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("detail");

    // Status should be either "healthy" or "unhealthy"
    expect(["healthy", "unhealthy"]).toContain(body.status);

    // Connected should be a boolean
    expect(typeof body.connected).toBe("boolean");

    // Timestamp should be a valid ISO string
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  test("GET /api/cache/heartbeat returns correct Content-Type", async ({ request }) => {
    const response = await request.get("/api/cache/heartbeat");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });
});