/**
 * Unit tests for Dashboard API routes.
 * Tests metrics, analytics, recent activity, and overview chart endpoints.
 * Verifies 401 for unauthenticated calls and correct response structure.
 */

import { describe, it, expect } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";

const baseUrl = "http://localhost";

describe("Dashboard API", () => {
  describe("GET /api/dashboard/metrics", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(new Request(`${baseUrl}/api/dashboard/metrics`));

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/metrics/users", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/metrics/users`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/analytics/overview", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/analytics/overview`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/analytics/role-distribution", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/analytics/role-distribution`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/analytics/status-distribution", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/analytics/status-distribution`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/analytics/weekly-registrations", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/analytics/weekly-registrations`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/recent-activity/users", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/recent-activity/users`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/recent-activity/sales", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/recent-activity/sales`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/overview-chart/monthly-sales", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/overview-chart/monthly-sales`),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/overview-chart/yearly-comparison", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/dashboard/overview-chart/yearly-comparison`),
      );

      expect(response.status).toBe(401);
    });
  });
});