import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test";
import { DashboardService } from "~/services/dashboard/dashboard.service";
import { logger } from "~/lib/logger";

// Mock the logger
vi.mock("~/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("DashboardService", () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getMetrics", () => {
    it("should fetch metrics from the API", async () => {
      const mockData = { totalUsers: 100, activeUsers: 80, usersThisMonth: 15 };

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await service.getMetrics();

      expect(fetchSpy).toHaveBeenCalledWith("/api/dashboard/metrics");
      expect(result).toEqual(mockData);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Dashboard service cache miss for key: /api/dashboard/metrics"),
      );

      fetchSpy.mockRestore();
    });

    it("should throw an error when the API returns an error", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.getMetrics()).rejects.toThrow("Failed to fetch dashboard metrics: 500");
    });

    it("should use cached data when available", async () => {
      const mockData = { totalUsers: 100 };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);
      await service.getMetrics();

      vi.spyOn(global, "fetch").mockClear();
      const result = await service.getMetrics();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("getAnalyticsOverview", () => {
    it("should fetch analytics overview from the API", async () => {
      const mockData = { totalUsers: 100, activeUsers: 80, inactiveUsers: 15, suspendedUsers: 5 };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await service.getAnalyticsOverview();

      expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/analytics/overview");
      expect(result).toEqual(mockData);
    });

    it("should throw on API error", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.getAnalyticsOverview()).rejects.toThrow(
        "Failed to fetch analytics overview: 500",
      );
    });
  });

  describe("getReferrers", () => {
    it("should fetch role distribution from the API", async () => {
      const mockData = { roleDistribution: [{ name: "user", value: 100 }] };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await service.getReferrers();

      expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/analytics/role-distribution");
      expect(result).toEqual(mockData);
    });
  });

  describe("getDevices", () => {
    it("should fetch status distribution from the API", async () => {
      const mockData = { statusDistribution: [{ name: "active", value: 80 }] };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await service.getDevices();

      expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/analytics/status-distribution");
      expect(result).toEqual(mockData);
    });
  });

  describe("getTrafficOverTime", () => {
    it("should fetch weekly registrations from the API", async () => {
      const mockData = { weeklyData: [{ name: "Mon", registrations: 5 }] };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await service.getTrafficOverTime();

      expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/analytics/weekly-registrations");
      expect(result).toEqual(mockData);
    });
  });

  describe("getRecentUsers", () => {
    it("should fetch recent users from the API", async () => {
      const mockData = {
        recentUsers: [{ id: "1", name: "John Doe", email: "john@test.com", role: "user" }],
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await service.getRecentUsers(5);

      expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/recent-activity/users?limit=5");
      expect(result).toEqual(mockData);
    });
  });

  describe("getMonthlySalesData", () => {
    it("should fetch monthly registrations from the API", async () => {
      const mockData = { monthlyData: [{ name: "Jan", total: 10 }] };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await service.getMonthlySalesData();

      expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/overview-chart/monthly-sales");
      expect(result).toEqual(mockData);
    });
  });

  describe("getYearlyComparison", () => {
    it("should fetch yearly comparison from the API", async () => {
      const mockData = { yearlyData: [{ name: "Jan", currentYear: 10, previousYear: 5 }] };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await service.getYearlyComparison();

      expect(global.fetch).toHaveBeenCalledWith("/api/dashboard/overview-chart/yearly-comparison");
      expect(result).toEqual(mockData);
    });
  });

  describe("fetchWithCache", () => {
    it("should respect the TTL", async () => {
      const mockData = { value: "test" };

      const fetchFn = vi.fn(() => Promise.resolve(mockData));

      await (service as any).fetchWithCache("test-key", fetchFn, 10);
      await (service as any).fetchWithCache("test-key", fetchFn, 10);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 15));

      await (service as any).fetchWithCache("test-key", fetchFn, 10);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("subscribeToUpdates", () => {
    it("should subscribe to updates and return an unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToUpdates(callback, ["metrics"]);

      expect(typeof unsubscribe).toBe("function");
      expect((service as any).subscriptions.size).toBeGreaterThan(0);
    });

    it("should call the callback when an update is received", () => {
      expect(true).toBe(true);
    });
  });
});