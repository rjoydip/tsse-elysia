/**
 * Contract tests for Users API endpoints.
 * Tests user listing, profile management, and administrative operations.
 * All endpoints require authentication; administrative endpoints require admin/superadmin role.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";
import { TEST_TOKENS } from "~/test/helpers/auth";

const app = apiRoutes;

beforeAll(async () => {
  // No setup needed for basic auth validation tests
});

afterAll(() => {
  closeStorage();
});

describe("Users API - Unauthenticated Access", () => {
  it("should return 401 for GET /api/users/", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/users/`));
    expect(response.status).toBe(401);
  });

  it("should return 401 for GET /api/users/me", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/users/me`));
    expect(response.status).toBe(401);
  });

  it("should return 401 for GET /api/users/:id", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/users/test-id`));
    expect(response.status).toBe(401);
  });

  it("should return 401 for PATCH /api/users/me/profile", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/users/me/profile`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName: "Test" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 for POST /api/users/", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/users/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          password: "password123",
        }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 for PATCH /api/users/:id", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/users/test-id`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName: "Updated" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 for PATCH /api/users/:id/status", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/users/test-id/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 for POST /api/users/:id/reset-password", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/users/test-id/reset-password`, {
        method: "POST",
      }),
    );
    expect(response.status).toBe(401);
  });
});

describe("Users API - Invalid Authentication", () => {
  it("should return 401 with invalid token", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/users/`, {
        headers: { Authorization: `Bearer ${TEST_TOKENS.INVALID}` },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 with malformed auth header", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/users/me`, {
        headers: { Authorization: "NotBearer some-token" },
      }),
    );
    expect(response.status).toBe(401);
  });
});

describe("Users API - Response Format", () => {
  it("should return JSON content type for users list", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/users/`));
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should return JSON content type for current user", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/users/me`));
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should return JSON content type for user by ID", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/users/test-id`));
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});