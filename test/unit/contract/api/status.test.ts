/**
 * Contract tests for Status API endpoints.
 * Tests historical health data retrieval functionality.
 */

import { describe, it, expect, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";

const app = apiRoutes;

afterAll(() => {
  closeStorage();
});

describe("GET /api/status/history", () => {
  it("should return 200 with status history array", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/status/history`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(0);
  });

  it("should return JSON content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/status/history`));
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should accept hours query parameter", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/status/history?hours=1`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("should return 500 for invalid hours parameter", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/status/history?hours=invalid`));
    // Invalid hours parameter causes DB query error (NaN in timestamp comparison)
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});