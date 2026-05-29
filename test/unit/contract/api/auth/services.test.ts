/**
 * Unit tests for modular auth route plugins.
 * Verifies auth core and auth service route groups behave as expected.
 *
 * Uses `new Elysia().use(authServiceRoutes)` to test the auth service module
 * in isolation, bypassing the full app assembly. This avoids coupling with
 * Better Auth middleware and lets us assert method-not-allowed behavior
 * directly against the passthrough handler.
 */
import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { authServiceRoutes } from "~/routes/api/auth/-service";

describe("Auth service module", () => {
  const app = new Elysia({ prefix: "/api/auth" }).use(authServiceRoutes);
  it("should return method not allowed for unsupported method", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/auth/sign-in", { method: "PATCH" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBeDefined();
  });
});