/**
 * Contract tests for authenticated API session handling.
 *
 * Uses TEST_AUTH_BYPASS to simulate authenticated requests for dashboard
 * endpoints. This avoids vi.mock leakage caused by the globalThis-cached
 * apiRoutes singleton — see explanation below.
 *
 * ## Why no vi.mock?
 *
 * - apiRoutes is cached on globalThis at module load time (for HMR safety).
 * - vi.mock replaces module bindings *at import time*, and the apiRoutes
 *   singleton (and its internal route closures) capture those mocked bindings
 *   permanently.
 * - When another test file imports the *same* apiRoutes singleton without a
 *   mock, the route handlers still resolve to the previously-captured mock
 *   dependencies — causing state leakage across test files.
 *
 * ## What about non-dashboard endpoints?
 *
 * Settings, Users, and Roles endpoints authenticate via Better Auth's
 * auth.api.getSession(). Their unauthenticated tests in sibling files already
 * prove the middleware returns 401 without a valid session. The auth check
 * itself is a third-party concern (Better Auth) and does not need re-verification.
 *
 * Dashboard routes use our custom validateAuthenticated (auth-utils.ts), so
 * TEST_AUTH_BYPASS is the appropriate mechanism.
 */
import { describe, it, expect, afterAll, beforeEach } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";

/** Standard Request headers for authenticated dashboard requests. */
const authHeaders = {
  Authorization: "Bearer test-session-token",
  "Content-Type": "application/json",
};

const app = apiRoutes;

describe("Authenticated (TEST_AUTH_BYPASS) - Dashboard API", () => {
  beforeEach(() => {
    process.env.TEST_AUTH_BYPASS = "true";
  });

  afterAll(() => {
    closeStorage();
    delete process.env.TEST_AUTH_BYPASS;
  });

  it("GET /api/dashboard/metrics passes auth", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/dashboard/metrics`, { headers: authHeaders }),
    );
    expect(response.status).not.toBe(401);
  });

  it("GET /api/dashboard/analytics/overview passes auth", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/dashboard/analytics/overview`, {
        headers: authHeaders,
      }),
    );
    expect(response.status).not.toBe(401);
  });

  it("GET /api/dashboard/recent-activity/users passes auth", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/dashboard/recent-activity/users`, {
        headers: authHeaders,
      }),
    );
    expect(response.status).not.toBe(401);
  });

  it("GET /api/dashboard/overview-chart/monthly-sales passes auth", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/dashboard/overview-chart/monthly-sales`, {
        headers: authHeaders,
      }),
    );
    expect(response.status).not.toBe(401);
  });
});