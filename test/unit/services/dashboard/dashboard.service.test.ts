import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test";
import { DashboardService } from "~/services/dashboard/dashboard.service";

// Mock the logger
const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

vi.mock("~/lib/logger", () => ({
  logger: mockLogger,
}));

// Mock the dashboard repository
const mockDashboardRepository = {
  getMetrics: vi.fn(),
  getAnalyticsOverview: vi.fn(),
  getUserRoleDistribution: vi.fn(),
  getUserStatusDistribution: vi.fn(),
  getWeeklyRegistrations: vi.fn(),
  getRecentUsers: vi.fn(),
  getMonthlyRegistrations: vi.fn(),
  getYearlyComparison: vi.fn(),
};

vi.mock("~/repositories/dashboard", () => ({
  dashboardRepository: mockDashboardRepository,
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
    it("should fetch metrics from the repository", async () => {
      const mockData = {
        totalUsers: 100,
        activeUsers: 80,
        inactiveUsers: 10,
        suspendedUsers: 5,
        userGrowth: 80,
        usersThisMonth: 20,
        timestamp: Date.now(),
      };

      mockDashboardRepository.getMetrics.mockResolvedValueOnce(mockData);

      const result = await service.getMetrics();

      expect(mockDashboardRepository.getMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockData);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Dashboard service cache miss for key: dashboard-metrics"),
      );
    });

    it("should throw an error when the repository throws an error", async () => {
      mockDashboardRepository.getMetrics.mockRejectedValueOnce(new Error("Database error"));

      await expect(service.getMetrics()).rejects.toThrow("Database error");
    });

    it("should use cached data when available", async () => {
      const mockData = {
        totalUsers: 100,
        activeUsers: 80,
        inactiveUsers: 10,
        suspendedUsers: 5,
        userGrowth: 80,
        usersThisMonth: 20,
        timestamp: Date.now(),
      };

      mockDashboardRepository.getMetrics.mockResolvedValueOnce(mockData);
      await service.getMetrics();

      // The cache should prevent a second call to the repository
      expect(mockDashboardRepository.getMetrics).toHaveBeenCalledTimes(1);
      const result = await service.getMetrics();
      expect(result).toEqual(mockData);
    });
  });

  describe("getAnalyticsOverview", () => {
    it("should fetch analytics overview from the repository", async () => {
      const mockData = { totalUsers: 100, activeUsers: 80, inactiveUsers: 15, suspendedUsers: 5 };

      mockDashboardRepository.getMetrics.mockResolvedValueOnce({
        totalUsers: mockData.totalUsers,
        activeUsers: mockData.activeUsers,
        inactiveUsers: mockData.inactiveUsers,
        suspendedUsers: mockData.suspendedUsers,
        userGrowth: 80,
        usersThisMonth: 20,
        timestamp: Date.now(),
      });

      const result = await service.getAnalyticsOverview();

      expect(mockDashboardRepository.getMetrics).toHaveBeenCalled();
      expect(result).toEqual({
        totalUsers: mockData.totalUsers,
        activeUsers: mockData.activeUsers,
        inactiveUsers: mockData.inactiveUsers,
        suspendedUsers: mockData.suspendedUsers,
      });
    });

    it("should throw on repository error", async () => {
      mockDashboardRepository.getMetrics.mockRejectedValueOnce(new Error("Database error"));

      await expect(service.getAnalyticsOverview()).rejects.toThrow("Database error");
    });
  });

  describe("getRoleDistribution", () => {
    it("should fetch role distribution from the repository", async () => {
      const mockData = [{ name: "user", value: 100 }];

      mockDashboardRepository.getUserRoleDistribution.mockResolvedValueOnce(mockData);

      const result = await service.getRoleDistribution();

      expect(mockDashboardRepository.getUserRoleDistribution).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("getStatusDistribution", () => {
    it("should fetch status distribution from the repository", async () => {
      const mockData = [{ name: "active", value: 80 }];

      mockDashboardRepository.getUserStatusDistribution.mockResolvedValueOnce(mockData);

      const result = await service.getStatusDistribution();

      expect(mockDashboardRepository.getUserStatusDistribution).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("getWeeklyRegistrations", () => {
    it("should fetch weekly registrations from the repository", async () => {
      const mockData = [{ name: "Mon", registrations: 5 }];

      mockDashboardRepository.getWeeklyRegistrations.mockResolvedValueOnce(mockData);

      const result = await service.getWeeklyRegistrations();

      expect(mockDashboardRepository.getWeeklyRegistrations).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("getRecentUsers", () => {
    it("should fetch recent users from the repository", async () => {
      const mockData = [
        {
          id: "1",
          avatarSrc: "/avatars/01.png",
          fallback: "JD",
          name: "John Doe",
          email: "john@test.com",
          role: "user",
          timestamp: Date.now(),
        },
      ];

      mockDashboardRepository.getRecentUsers.mockResolvedValueOnce(mockData);

      const result = await service.getRecentUsers(5);

      expect(mockDashboardRepository.getRecentUsers).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockData);
    });
  });

  describe("getMonthlyRegistrations", () => {
    it("should fetch monthly registrations from the repository", async () => {
      const mockData = [{ name: "Jan", total: 10 }];

      mockDashboardRepository.getMonthlyRegistrations.mockResolvedValueOnce(mockData);

      const result = await service.getMonthlyRegistrations();

      expect(mockDashboardRepository.getMonthlyRegistrations).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("getYearlyRegistrationsComparison", () => {
    it("should fetch yearly comparison from the repository", async () => {
      const mockData = [{ name: "Jan", currentYear: 10, previousYear: 5 }];

      mockDashboardRepository.getYearlyComparison.mockResolvedValueOnce(mockData);

      const result = await service.getYearlyRegistrationsComparison();

      expect(mockDashboardRepository.getYearlyComparison).toHaveBeenCalled();
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
    });
  });
});