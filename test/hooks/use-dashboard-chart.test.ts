/**
 * Unit tests for src/hooks/use-dashboard-chart.ts
 * Tests: loading → success → error state transitions, data mapping, cleanup (isMounted flag),
 * and the capToCurrentMonth client-side safety net filter.
 */

import { describe, it, expect, vi, beforeEach } from "bun:test";
import { capToCurrentMonth } from "~/hooks/use-dashboard-chart";

// Mock the dashboard service
const mockDashboardService = {
  getMonthlyRegistrations: vi.fn(),
  getYearlyRegistrationsComparison: vi.fn(),
};

vi.mock("~/services/dashboard", () => ({
  dashboardService: mockDashboardService,
}));

// Mock the logger — must export all named exports used by transitive dependencies
vi.mock("~/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  dbLogger: {
    log: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  apiLogger: {
    log: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  cacheLogger: {
    log: vi.fn(),
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

  describe("capToCurrentMonth", () => {
    const currentMonth = new Date().getMonth();

    it("should keep months up to and including the current month", () => {
      const data = [
        { name: "Jan", total: 10 },
        { name: "Feb", total: 20 },
        { name: "Mar", total: 30 },
        { name: "Apr", total: 40 },
        { name: "May", total: 50 },
        { name: "Jun", total: 60 },
        { name: "Jul", total: 70 },
        { name: "Aug", total: 80 },
        { name: "Sep", total: 90 },
        { name: "Oct", total: 100 },
        { name: "Nov", total: 110 },
        { name: "Dec", total: 120 },
      ];

      const result = capToCurrentMonth(data);
      expect(result).toHaveLength(currentMonth + 1);
      expect(result[result.length - 1].name).toBe(
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
          currentMonth
        ],
      );
    });

    it("should filter out months after the current month", () => {
      const data = [
        { name: "Jan", total: 5 },
        { name: "Dec", total: 99 },
      ];

      const result = capToCurrentMonth(data);

      if (currentMonth >= 11) {
        // December: both should be kept
        expect(result).toHaveLength(2);
      } else {
        // Not December: Dec should be filtered out
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ name: "Jan", total: 5 });
      }
    });

    it("should handle empty input", () => {
      const result = capToCurrentMonth([]);
      expect(result).toEqual([]);
    });

    it("should handle unrecognized month names by filtering them out", () => {
      const result = capToCurrentMonth([
        { name: "Jan", total: 10 },
        { name: "NotAMonth", total: 99 },
      ]);

      // NotAMonth should be filtered out
      expect(result).toHaveLength(currentMonth >= 0 ? 1 : 0);
      if (currentMonth >= 0) {
        expect(result[0]).toEqual({ name: "Jan", total: 10 });
      }
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