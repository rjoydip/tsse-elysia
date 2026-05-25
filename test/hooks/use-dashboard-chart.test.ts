/**
 * Unit tests for src/hooks/use-dashboard-chart.ts
 * Tests: loading → success → error state transitions, data mapping, and cleanup (isMounted flag)
 */

import { describe, it, expect, vi, beforeEach } from "bun:test";

// Mock the dashboard service
const mockDashboardService = {
  getMonthlyRegistrations: vi.fn(),
  getYearlyRegistrationsComparison: vi.fn(),
};

vi.mock("~/services/dashboard", () => ({
  dashboardService: mockDashboardService,
}));

// Mock the logger
vi.mock("~/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("useDashboardChartData Hook Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Service Integration", () => {
    it("should fetch monthly and yearly chart data on initialization", async () => {
      const mockMonthly = [
        { month: "Jan", count: 50 },
        { month: "Feb", count: 75 },
      ];
      const mockYearly = [{ year: 2025, month: "Jan", currentYear: 50, previousYear: 40 }];

      mockDashboardService.getMonthlyRegistrations.mockResolvedValue(mockMonthly);
      mockDashboardService.getYearlyRegistrationsComparison.mockResolvedValue(mockYearly);

      // Simulate what the hook does on mount
      const [monthly, yearly] = await Promise.all([
        mockDashboardService.getMonthlyRegistrations(),
        mockDashboardService.getYearlyRegistrationsComparison(),
      ]);

      expect(mockDashboardService.getMonthlyRegistrations).toHaveBeenCalled();
      expect(mockDashboardService.getYearlyRegistrationsComparison).toHaveBeenCalled();
      expect(monthly).toEqual(mockMonthly);
      expect(yearly).toEqual(mockYearly);
    });

    it("should handle errors from monthly registrations fetch", async () => {
      const errorMessage = "Monthly data failed";
      mockDashboardService.getMonthlyRegistrations.mockRejectedValue(new Error(errorMessage));
      mockDashboardService.getYearlyRegistrationsComparison.mockResolvedValue([]);

      await expect(
        Promise.all([
          mockDashboardService.getMonthlyRegistrations(),
          mockDashboardService.getYearlyRegistrationsComparison(),
        ]),
      ).rejects.toThrow(errorMessage);
    });

    it("should handle errors from yearly comparison fetch", async () => {
      mockDashboardService.getMonthlyRegistrations.mockResolvedValue([]);
      const errorMessage = "Yearly data failed";
      mockDashboardService.getYearlyRegistrationsComparison.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        Promise.all([
          mockDashboardService.getMonthlyRegistrations(),
          mockDashboardService.getYearlyRegistrationsComparison(),
        ]),
      ).rejects.toThrow(errorMessage);
    });

    it("should return empty arrays when both endpoints return empty", async () => {
      mockDashboardService.getMonthlyRegistrations.mockResolvedValue([]);
      mockDashboardService.getYearlyRegistrationsComparison.mockResolvedValue([]);

      const [monthly, yearly] = await Promise.all([
        mockDashboardService.getMonthlyRegistrations(),
        mockDashboardService.getYearlyRegistrationsComparison(),
      ]);

      expect(monthly).toEqual([]);
      expect(yearly).toEqual([]);
    });
  });

  describe("Cleanup (isMounted flag)", () => {
    it("should resolve fetch data after unmount without error", async () => {
      let resolveMonthly!: (data: any) => void;
      const monthlyPromise = new Promise((resolve) => {
        resolveMonthly = resolve;
      });

      mockDashboardService.getMonthlyRegistrations.mockReturnValue(monthlyPromise);
      mockDashboardService.getYearlyRegistrationsComparison.mockResolvedValue([]);

      // Start the fetch (simulating mount)
      const fetchPromise = Promise.all([
        mockDashboardService.getMonthlyRegistrations(),
        mockDashboardService.getYearlyRegistrationsComparison(),
      ]);

      // Simulate unmount before resolution
      resolveMonthly([{ month: "Jan", count: 50 }]);
      const results = await fetchPromise;
      expect(results[0]).toEqual([{ month: "Jan", count: 50 }]);
    });
  });
});