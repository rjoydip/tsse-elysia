/**
 * Contract tests for heartbeat API endpoints.
 * Validates liveness probe response structure and content type
 * for both cache and database heartbeat endpoints.
 *
 * These test through the full app stack via app.handle().
 * Isolated plugin-level heartbeat tests are in test/unit/routes/.
 */
import { describe, it, expect, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";

const app = apiRoutes;

afterAll(() => {
  closeStorage();
});

describe("GET /api/cache/heartbeat", () => {
  it("should return valid response (200 or 503)", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/cache/heartbeat`));

    expect([200, 503]).toContain(response.status);
  });

  it("should include required response fields", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/cache/heartbeat`));
    const body = await response.json();

    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("connected");
    expect(body).toHaveProperty("url");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("detail");
    expect(body).toHaveProperty("backend");
    expect(body).toHaveProperty("latencyMs");
  });

  it("should have valid status and connected types", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/cache/heartbeat`));
    const body = await response.json();

    expect(["healthy", "unhealthy"]).toContain(body.status);
    expect(typeof body.connected).toBe("boolean");
  });

  it("should return valid ISO timestamp", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/cache/heartbeat`));
    const body = await response.json();

    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("should return valid backend type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/cache/heartbeat`));
    const body = await response.json();

    expect(["redis", "lru", "postgres"]).toContain(body.backend);
  });

  it("should return non-negative latency measurement", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/cache/heartbeat`));
    const body = await response.json();

    expect(body.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should return JSON content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/cache/heartbeat`));

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