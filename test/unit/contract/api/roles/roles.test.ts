/**
 * Contract tests for Roles CRUD API endpoints.
 * Tests unauthorized access patterns for role and role-permission operations.
 */

import { describe, it, expect, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";
import { TEST_TOKENS } from "~/test/helpers/auth";

const app = apiRoutes;

afterAll(() => {
  closeStorage();
});

describe("Roles API - Unauthenticated Access", () => {
  it("should return 401 for GET /api/roles/:id", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/roles/some-id`));
    expect(response.status).toBe(401);
  });

  it("should return 401 for PUT /api/roles/:id", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/some-id`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "updated-role" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 for DELETE /api/roles/:id", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/some-id`, {
        method: "DELETE",
      }),
    );
    expect(response.status).toBe(401);
  });
});

describe("Roles API - Unauthenticated Permission Operations", () => {
  it("should return 401 for PUT /api/roles/permissions/:id", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/permissions/some-id`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "updated-perm" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 for DELETE /api/roles/permissions/:id", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/permissions/some-id`, {
        method: "DELETE",
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 404 for removed POST /api/roles/permissions/seed", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/permissions/seed`, {
        method: "POST",
      }),
    );
    expect(response.status).toBe(404);
  });
});

describe("Roles API - Invalid Token", () => {
  it("should return 401 with invalid token for role detail", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/some-id`, {
        headers: { Authorization: `Bearer ${TEST_TOKENS.INVALID}` },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 with malformed auth header for role update", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/some-id`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          Authorization: "NotBearer some-token",
        },
        body: JSON.stringify({ name: "updated-role" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid token for permission delete", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/roles/permissions/some-id`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TEST_TOKENS.INVALID}` },
      }),
    );
    expect(response.status).toBe(401);
  });
});