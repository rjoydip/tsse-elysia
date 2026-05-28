/**
 * Contract tests for Roles and Permissions API endpoints.
 * Tests CRUD operations for permissions and roles requiring admin access.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";
import { TEST_TOKENS } from "~/test/helpers/auth";

const app = apiRoutes;

beforeAll(async () => {
  // No setup needed for roles tests as they validate admin access
});

afterAll(() => {
  closeStorage();
});

describe("Roles and Permissions API - Unauthenticated Access", () => {
  it("should return 401 for GET /api/roles/permissions", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/roles/permissions`));
    expect(response.status).toBe(401);
  });

  it("should return 401 for POST /api/roles/permissions", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/permissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "test-perm", description: "Test permission" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 for GET /api/roles", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/roles`));
    expect(response.status).toBe(401);
  });

  it("should return 401 for POST /api/roles", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "test-role", description: "Test role" }),
      }),
    );
    expect(response.status).toBe(401);
  });
});

describe("Roles and Permissions API - Invalid Token", () => {
  it("should return 401 with invalid token", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/permissions`, {
        headers: { Authorization: `Bearer ${TEST_TOKENS.INVALID}` },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 with malformed auth header", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles`, {
        headers: { Authorization: "NotBearer some-token" },
      }),
    );
    expect(response.status).toBe(401);
  });
});