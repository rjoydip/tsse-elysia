/**
 * Contract tests for Dashboard API routes.
 * Tests auth enforcement on metrics, analytics, recent activity, and overview chart endpoints.
 * All dashboard endpoints require authentication.
 */

import { describe, it, expect, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";

const app = apiRoutes;

afterAll(() => {
  closeStorage();
});

describe("Dashboard API", () => {
  describe("Metrics endpoints", () => {
    it("GET /api/dashboard/metrics should return 401 without auth", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/api/dashboard/metrics`));

      expect(response.status).toBe(401);
    });

    it("GET /api/dashboard/metrics/users should return 401 without auth", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/api/dashboard/metrics/users`));

      expect(response.status).toBe(401);
    });
  });

  describe("Analytics endpoints", () => {
    it("GET /api/dashboard/analytics/overview should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/dashboard/analytics/overview`),
      );

      expect(response.status).toBe(401);
    });

    it("GET /api/dashboard/analytics/role-distribution should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/dashboard/analytics/role-distribution`),
      );

      expect(response.status).toBe(401);
    });

    it("GET /api/dashboard/analytics/status-distribution should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/dashboard/analytics/status-distribution`),
      );

      expect(response.status).toBe(401);
    });

    it("GET /api/dashboard/analytics/weekly-registrations should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/dashboard/analytics/weekly-registrations`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("Recent activity endpoints", () => {
    it("GET /api/dashboard/recent-activity/users should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/dashboard/recent-activity/users`),
      );

      expect(response.status).toBe(401);
    });

    it("GET /api/dashboard/recent-activity/sales should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/dashboard/recent-activity/sales`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("Overview chart endpoints", () => {
    it("GET /api/dashboard/overview-chart/monthly-sales should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/dashboard/overview-chart/monthly-sales`),
      );

      expect(response.status).toBe(401);
    });

    it("GET /api/dashboard/overview-chart/yearly-comparison should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/dashboard/overview-chart/yearly-comparison`),
      );

      expect(response.status).toBe(401);
    });
  });
});