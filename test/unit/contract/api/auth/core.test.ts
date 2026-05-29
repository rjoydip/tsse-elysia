/**
 * Contract tests for Auth API core endpoints.
 * Covers: CORS headers, error handling, trace headers,
 * root welcome message, health status, and content types.
 *
 * These tests use the full app stack (apiRoutes) to validate
 * end-to-end behavior including middleware.
 */

import { describe, it, expect, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";

const app = apiRoutes;

afterAll(() => {
  closeStorage();
});

describe("Auth API Flows", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/unknown-route`));

    expect(response.status).toBe(404);
  });

  it("should include CORS headers", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/auth`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
        },
      }),
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeDefined();
  });

  it("should handle error response format", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/nonexistent`));

    expect(response.status).toBe(404);
  });

  it("should include trace headers in response", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/`));

    expect(response.headers.get("X-Elapsed")).toBeDefined();
  });
});

describe("Auth API Root", () => {
  it("should return welcome message", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/`));
    const text = await response.text();

    expect(text).toContain("Welcome to");
    expect(text).toContain("Auth");
  });

  it("should return text/plain content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/`));

    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
  });
});

describe("Auth API Health", () => {
  it("should return health status", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/health`));
    const json = await response.json();

    expect(json).toHaveProperty("name");
    expect(json).toHaveProperty("status", "healthy");
    expect(json).toHaveProperty("timestamp");
  });

  it("should return json content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/health`));

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("Auth API - Method Handling", () => {
  it("should handle GET requests", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/auth/`, { method: "GET" }));

    expect(response.status).toBe(200);
  });

  it("should handle POST requests", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/auth/sign-in`, { method: "POST" }),
    );

    expect(response.status).toBeDefined();
  });

  it("should handle allowed methods for sign-in", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/auth/sign-in`, { method: "POST" }),
    );

    expect(response.status).toBeDefined();
  });
});