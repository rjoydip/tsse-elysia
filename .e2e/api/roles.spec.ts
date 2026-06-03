/**
 * E2E tests for roles and permissions API.
 * Tests CRUD operations and authorization enforcement.
 */

import { test, expect, type APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../config";

function uniqueEmail(prefix = "role-test") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function signUp(
  request: APIRequestContext,
  email: string,
  password = "TestPassword123!",
  name = "Test User",
) {
  return request.post("/api/auth/sign-up/email", {
    headers: { Origin: E2E_BASE_URL },
    data: { email, password, name },
  });
}

async function signIn(request: APIRequestContext, email: string, password = "TestPassword123!") {
  return request.post("/api/auth/sign-in/email", {
    headers: { Origin: E2E_BASE_URL },
    data: { email, password },
  });
}

test.describe("Roles API - Unauthenticated Access", () => {
  test("should return 401 for GET /api/roles/permissions", async ({ request }) => {
    const response = await request.get("/api/roles/permissions");
    expect(response.status()).toBe(401);
  });

  test("should return 401 for POST /api/roles/permissions", async ({ request }) => {
    const response = await request.post("/api/roles/permissions", {
      data: { name: "test:perm" },
    });
    expect(response.status()).toBe(401);
  });

  test("should return 401 for GET /api/roles", async ({ request }) => {
    const response = await request.get("/api/roles");
    expect(response.status()).toBe(401);
  });

  test("should return 401 for POST /api/roles", async ({ request }) => {
    const response = await request.post("/api/roles", {
      data: { name: "test-role" },
    });
    expect(response.status()).toBe(401);
  });

  test("should return 401 for DELETE /api/roles/permissions/:id", async ({ request }) => {
    const response = await request.delete("/api/roles/permissions/some-id");
    expect(response.status()).toBe(401);
  });
});

test.describe("Roles API - Regular User Access (should be 403)", () => {
  let testEmail: string;
  let testPassword = "TestPassword123!";

  test.beforeEach(async ({ request }) => {
    testEmail = uniqueEmail("regular");
    await signUp(request, testEmail, testPassword);
  });

  test("should return 403 for GET /api/roles/permissions", async ({ request }) => {
    const response = await request.get("/api/roles/permissions");
    expect(response.status()).toBe(403);
  });

  test("should return 403 for GET /api/roles", async ({ request }) => {
    const response = await request.get("/api/roles");
    expect(response.status()).toBe(403);
  });

  test("should return 403 for POST /api/roles", async ({ request }) => {
    const response = await request.post("/api/roles", {
      data: { name: "test-role" },
    });
    expect(response.status()).toBe(403);
  });
});

test.describe("Roles API - Admin Access (seeded superadmin)", () => {
  test("should get permissions list as superadmin", async ({ request }) => {
    // Sign in with seeded superadmin credentials
    const signInResponse = await signIn(request, "superadmin@tsse.io", "SuperAdmin123!");
    expect(signInResponse.status()).toBe(200);

    const response = await request.get("/api/roles/permissions");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.permissions).toBeDefined();
    expect(Array.isArray(body.permissions)).toBe(true);
  });

  test("should get roles list as superadmin", async ({ request }) => {
    const signInResponse = await signIn(request, "superadmin@tsse.io", "SuperAdmin123!");
    expect(signInResponse.status()).toBe(200);

    const response = await request.get("/api/roles");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.roles).toBeDefined();
    expect(Array.isArray(body.roles)).toBe(true);
  });
});

test.describe("Dashboard Metrics - Roles and Permissions Count", () => {
  test("should return metrics with role and permission counts", async ({ request }) => {
    const signInResponse = await signIn(request, "superadmin@tsse.io", "SuperAdmin123!");
    expect(signInResponse.status()).toBe(200);

    const response = await request.get("/api/dashboard/metrics");
    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty("totalRoles");
    expect(typeof body.totalRoles).toBe("number");
    expect(body).toHaveProperty("totalPermissions");
    expect(typeof body.totalPermissions).toBe("number");
  });
});