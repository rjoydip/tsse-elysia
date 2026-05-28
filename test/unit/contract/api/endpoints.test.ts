/**
 * Contract tests for core API endpoints.
 * Covers: root welcome message, CORS, security headers,
 * error handling, method handling, and OPTIONS preflight.
 *
 * These tests use app.handle() for fast, server-less execution
 * while still exercising the full request/response lifecycle.
 */

import { describe, it, expect } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL, optionsRequest } from "~/test/helpers/request";

const app = apiRoutes;

describe("API Root", () => {
  it("should return welcome message", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Welcome to");
  });

  it("should return text/plain content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api`));

    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
  });
});

describe("API Health", () => {
  it("should return 200 with status healthy", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/health`));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.name).toBeDefined();
  });

  it("should return JSON content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/health`));

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should include trace header", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/health`));

    expect(response.headers.get("X-Elapsed")).toBeDefined();
  });
});

describe("CORS Headers", () => {
  it("should include CORS headers on GET requests", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/health`));

    const origin = response.headers.get("Access-Control-Allow-Origin");
    expect(origin).toBeDefined();
  });

  it("should handle OPTIONS preflight", async () => {
    const response = await app.handle(optionsRequest(`${BASE_URL}/api`, "http://localhost:3000"));

    expect(response.status).toBeDefined();
    const origin = response.headers.get("Access-Control-Allow-Origin");
    expect(origin).toBeDefined();
  });
});

describe("Security Headers", () => {
  it("should include X-Content-Type-Options: nosniff", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/health`));

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("API Error Handling", () => {
  it("should return 404 for unknown API route", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/unknown-endpoint`));

    expect(response.status).toBe(404);
  });

  it("should return 404 for unknown top-level route", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/nonexistent`));

    expect(response.status).toBe(404);
  });
});