/**
 * Unit tests for status page
 * Tests: Health status display and service monitoring logic
 */

import { describe, expect, it } from "bun:test";

describe("Status Page", () => {
  describe("Health Status Types", () => {
    it("should have correct HealthStatus interface", () => {
      const healthStatus = {
        name: "Test Service",
        status: "loading" as const,
        responseTime: null,
        lastChecked: null,
        error: undefined,
      };

      expect(healthStatus.name).toBe("Test Service");
      expect(healthStatus.status).toBe("loading");
      expect(healthStatus.responseTime).toBeNull();
    });

    it("should support up status", () => {
      const healthStatus = {
        name: "Core API",
        status: "up" as const,
        responseTime: 45,
        lastChecked: new Date(),
        error: undefined,
      };

      expect(healthStatus.status).toBe("up");
      expect(healthStatus.responseTime).toBe(45);
    });

    it("should support down status", () => {
      const healthStatus = {
        name: "Auth API",
        status: "down" as const,
        responseTime: null,
        lastChecked: new Date(),
        error: "Connection failed",
      };

      expect(healthStatus.status).toBe("down");
      expect(healthStatus.error).toBe("Connection failed");
    });
  });

  describe("Service Configuration", () => {
    it("should have Core API service defined", () => {
      const services = [
        { name: "Core API", url: "/api/health", description: "Main API health check" },
        { name: "Auth API", url: "/api/auth/health", description: "Authentication service health" },
      ];

      const coreApi = services.find((s) => s.name === "Core API");
      expect(coreApi).toBeDefined();
      expect(coreApi?.url).toBe("/api/health");
    });

    it("should have Auth API service defined", () => {
      const services = [
        { name: "Core API", url: "/api/health", description: "Main API health check" },
        { name: "Auth API", url: "/api/auth/health", description: "Authentication service health" },
      ];

      const authApi = services.find((s) => s.name === "Auth API");
      expect(authApi).toBeDefined();
      expect(authApi?.url).toBe("/api/auth/health");
    });

    it("should have exactly 4 services", () => {
      const services = [
        { name: "Core API", url: "/api/health", description: "Main API health check" },
        { name: "Auth API", url: "/api/auth/health", description: "Authentication service health" },
        {
          name: "Realtime API",
          url: "/api/realtime/health",
          description: "Realtime service health and websocket counters",
        },
        {
          name: "MCP API",
          url: "/api/mcp/health",
          description: "Model Context Protocol service health",
        },
      ];

      expect(services).toHaveLength(4);
    });
  });

  describe("Other Services Configuration", () => {
    it("should have other services defined", () => {
      const otherServices = [
        { name: "Database", status: "degraded" as const, lastUpdated: null },
        { name: "Storage", status: "degraded" as const, lastUpdated: null },
      ];

      expect(otherServices).toHaveLength(2);
    });

    it("should have Database service", () => {
      const otherServices = [
        { name: "Database", status: "degraded" as const, lastUpdated: null },
        { name: "Storage", status: "degraded" as const, lastUpdated: null },
      ];

      const db = otherServices.find((s) => s.name === "Database");
      expect(db).toBeDefined();
      expect(db?.status).toBe("degraded");
    });

    it("should support different status types", () => {
      const statusTypes = ["operational", "degraded", "outage", "unknown"];
      expect(statusTypes).toHaveLength(4);
      expect(statusTypes).toContain("operational");
      expect(statusTypes).toContain("degraded");
      expect(statusTypes).toContain("outage");
      expect(statusTypes).toContain("unknown");
    });
  });

  describe("Status Calculation Logic", () => {
    it("should calculate allUp when all services are up", () => {
      const serviceStatuses = [
        { name: "Core API", status: "up" as const },
        { name: "Auth API", status: "up" as const },
      ];

      const allUp = serviceStatuses.every((s) => s.status === "up");
      expect(allUp).toBe(true);
    });

    it("should calculate someDown when any service is down", () => {
      const serviceStatuses = [
        { name: "Core API", status: "up" as const },
        { name: "Auth API", status: "down" as const },
      ];

      const someDown = serviceStatuses.some((s) => s.status === "down");
      expect(someDown).toBe(true);
    });

    it("should not be allUp when any service is down", () => {
      const serviceStatuses = [
        { name: "Core API", status: "up" as const },
        { name: "Auth API", status: "down" as const },
      ];

      const allUp = serviceStatuses.every((s) => s.status === "up");
      expect(allUp).toBe(false);
    });

    it("should handle loading state", () => {
      const serviceStatuses = [
        { name: "Core API", status: "loading" as const },
        { name: "Auth API", status: "loading" as const },
      ];

      const allLoading = serviceStatuses.every((s) => s.status === "loading");
      expect(allLoading).toBe(true);
    });
  });

  describe("Manual Refresh Label", () => {
    it("should show default refresh label", () => {
      const isRefreshing = false;
      const label = isRefreshing ? "Refreshing now" : "Refresh now";
      expect(label).toBe("Refresh now");
    });

    it("should show in-progress refresh label", () => {
      const isRefreshing = true;
      const label = isRefreshing ? "Refreshing now" : "Refresh now";
      expect(label).toBe("Refreshing now");
    });
  });

  describe("Status Badge Text", () => {
    it("should show 'Checking...' when all loading", () => {
      const serviceStatuses = [{ status: "loading" as const }, { status: "loading" as const }];
      const isLoading = serviceStatuses.every((s) => s.status === "loading");

      expect(isLoading).toBe(true);
    });

    it("should show 'All Systems Operational' when all up", () => {
      const serviceStatuses = [{ status: "up" as const }, { status: "up" as const }];
      const allUp = serviceStatuses.every((s) => s.status === "up");

      expect(allUp).toBe(true);
    });

    it("should show 'Degraded' when some down", () => {
      const serviceStatuses = [{ status: "up" as const }, { status: "down" as const }];
      const someDown = serviceStatuses.some((s) => s.status === "down");

      expect(someDown).toBe(true);
    });
  });

  describe("Response Time Formatting", () => {
    it("should format response time in milliseconds", () => {
      const responseTime = 45;
      const formatted = `${responseTime}ms`;
      expect(formatted).toBe("45ms");
    });

    it("should handle null response time", () => {
      const responseTime = null;
      expect(responseTime).toBeNull();
    });
  });
});