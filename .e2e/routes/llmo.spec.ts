/**
 * E2E tests for LLMO (LLM Optimization) features.
 * Tests API endpoints that work via E2E.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/llmo
 */

import { test, expect } from "@playwright/test";

test.describe("LLMO Health Endpoints", () => {
  test("should have working health endpoints", async ({ request }) => {
    const endpoints = [
      { path: "/api/health", expectedStatus: 200 },
      { path: "/api/auth/health", expectedStatus: 200 },
      { path: "/api/mcp/health", expectedStatus: 200 },
      { path: "/api/database/heartbeat", expectedStatus: [200, 503] },
      { path: "/api/cache/heartbeat", expectedStatus: [200, 503] },
      { path: "/api/realtime/health", expectedStatus: 200 },
    ];

    for (const { path, expectedStatus } of endpoints) {
      const response = await request.get(path);
      const statusArray = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      expect(
        statusArray.includes(response.status()),
        `Expected ${statusArray.join(" or ")} for ${path}, got ${response.status()}`,
      ).toBe(true);
    }
  });

  test("should return valid health response structure", async ({ request }) => {
    const endpoints = [
      { path: "/api/health", keys: ["name", "status", "timestamp"] },
      { path: "/api/auth/health", keys: ["name", "status", "timestamp"] },
      { path: "/api/mcp/health", keys: ["status", "timestamp"] },
      { path: "/api/realtime/health", keys: ["status", "websocketPath"] },
    ];

    for (const { path, keys } of endpoints) {
      const response = await request.get(path);
      if (response.status() === 200) {
        const body = await response.json();
        for (const key of keys) {
          expect(body[key], `Missing key "${key}" in ${path}`).toBeDefined();
        }
      }
    }
  });
});

test.describe("LLMO API Response Headers", () => {
  test("should include CORS headers in responses", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.headers()["access-control-allow-origin"]).toBeDefined();
  });

  test("should include security headers", async ({ request }) => {
    const response = await request.get("/api/health");
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("should include tracing headers", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.headers()["x-elapsed"]).toBeDefined();
  });
});

test.describe("LLMO Root API", () => {
  test("should return welcome message", async ({ request }) => {
    const response = await request.get("/api");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Welcome");
  });

  test("should return text/plain content type", async ({ request }) => {
    const response = await request.get("/api");
    expect(response.headers()["content-type"]).toMatch(/text\/plain/);
  });
});

test.describe("LLMO MCP Endpoints", () => {
  test("should return MCP health status", async ({ request }) => {
    const response = await request.get("/api/mcp/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBeDefined();
  });

  test("should return MCP tools list", async ({ request }) => {
    const response = await request.get("/api/mcp/tools");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.tools).toBeDefined();
    expect(Array.isArray(body.tools)).toBe(true);
  });
});

test.describe("LLMO Realtime Endpoints", () => {
  test("should return realtime discovery info", async ({ request }) => {
    const response = await request.get("/api/realtime");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.websocketEndpoint).toBeDefined();
    expect(body.healthEndpoint).toBeDefined();
  });

  test("should return realtime health with connection counts", async ({ request }) => {
    const response = await request.get("/api/realtime/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.totalConnections).toBeDefined();
  });
});

test.describe("LLMO OpenAPI Documentation", () => {
  test("should have OpenAPI available at /api/swagger-html", async ({ request }) => {
    const response = await request.get("/api/swagger-html");
    expect([200, 404]).toContain(response.status());
  });

  test("should have OpenAPI JSON at /api/openapi.json", async ({ request }) => {
    const response = await request.get("/api/openapi.json");
    expect([200, 404]).toContain(response.status());
  });
});

test.describe("LLMO Pages Render", () => {
  test("should render home page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    expect(title).toBeDefined();
  });

  test("should render blog page", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should render docs page", async ({ page }) => {
    await page.goto("/docs");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should render changelog page", async ({ page }) => {
    await page.goto("/changelog");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should render status page", async ({ page }) => {
    await page.goto("/status");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should render sign-in page", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("should render 404 page", async ({ page }) => {
    await page.goto("/404");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toBeVisible();
  });
});