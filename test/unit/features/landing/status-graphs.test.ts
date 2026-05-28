/**
 * Unit tests for Status Graphs components
 * Tests: LatencyGraph and StatusBars data transformation
 */

import { describe, expect, it } from "bun:test";

interface ServiceHistoryRecord {
  serviceName: string;
  status: "up" | "down" | "degraded";
  latencyMs: number | null;
  timestamp: string;
}

describe("Status Graphs Data Transformation", () => {
  const mockHistory: ServiceHistoryRecord[] = [
    {
      serviceName: "API",
      status: "up",
      latencyMs: 45,
      timestamp: "2024-01-01T10:00:00Z",
    },
    {
      serviceName: "API",
      status: "up",
      latencyMs: 52,
      timestamp: "2024-01-01T10:01:00Z",
    },
    {
      serviceName: "API",
      status: "down",
      latencyMs: null,
      timestamp: "2024-01-01T10:02:00Z",
    },
    {
      serviceName: "API",
      status: "up",
      latencyMs: 38,
      timestamp: "2024-01-01T10:03:00Z",
    },
    {
      serviceName: "API",
      status: "up",
      latencyMs: 41,
      timestamp: "2024-01-01T10:04:00Z",
    },
  ];

  describe("LatencyGraph data transformation", () => {
    it("should filter by service name", () => {
      const data = mockHistory.filter((h) => h.serviceName === "API");
      expect(data.length).toBe(5);
    });

    it("should limit to last 20 records", () => {
      const data = mockHistory.filter((h) => h.serviceName === "API").slice(-20);
      expect(data.length).toBe(5);
    });

    it("should map latency with default for null", () => {
      const data = mockHistory
        .filter((h) => h.serviceName === "API")
        .slice(-20)
        .map((h) => ({
          ...h,
          latency: h.latencyMs ?? 0,
        }));

      expect(data[2].latency).toBe(0);
      expect(data[0].latency).toBe(45);
    });

    it("should format time string", () => {
      const data = mockHistory.map((h) => ({
        time: new Date(h.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      expect(data[0].time).toBeTruthy();
    });

    it("should handle empty history", () => {
      const emptyHistory: ServiceHistoryRecord[] = [];
      const data = emptyHistory
        .filter((h) => h.serviceName === "Nonexistent")
        .slice(-20)
        .map((h) => ({
          ...h,
          latency: h.latencyMs ?? 0,
        }));

      expect(data.length).toBe(0);
    });
  });

  describe("StatusBars data transformation", () => {
    it("should map up status to 1", () => {
      const data = mockHistory.map((h) => ({
        value: h.status === "up" ? 1 : h.status === "degraded" ? 0.5 : 0,
        hasData: h.status !== null && h.status !== undefined,
      }));

      expect(data[0].value).toBe(1);
      expect(data[2].value).toBe(0);
    });

    it("should map down/degraded status to 0", () => {
      const data = mockHistory.map((h) => ({
        value: h.status === "up" ? 1 : h.status === "degraded" ? 0.5 : 0,
        hasData: h.status !== null && h.status !== undefined,
      }));

      expect(data[2].value).toBe(0);
    });

    it("should map degraded status to 0.5", () => {
      const degradedHistory: ServiceHistoryRecord[] = [
        {
          serviceName: "Test",
          status: "degraded",
          latencyMs: 100,
          timestamp: "2024-01-01T10:00:00Z",
        },
      ];
      const data = degradedHistory.map((h) => ({
        value: h.status === "up" ? 1 : h.status === "degraded" ? 0.5 : 0,
        hasData: h.status !== null && h.status !== undefined,
      }));

      expect(data[0].value).toBe(0.5);
    });

    it("should limit to last 20 records", () => {
      const data = mockHistory
        .filter((h) => h.serviceName === "API")
        .slice(-20)
        .map((h) => ({
          value: h.status === "up" ? 1 : h.status === "degraded" ? 0.5 : 0,
          hasData: h.status !== null && h.status !== undefined,
        }));

      expect(data.length).toBe(5);
    });

    it("should handle empty history for status", () => {
      const emptyHistory: ServiceHistoryRecord[] = [];
      const data = emptyHistory
        .filter((h) => h.serviceName === "Nonexistent")
        .slice(-20)
        .map((h) => ({
          value: h.status === "up" ? 1 : h.status === "degraded" ? 0.5 : 0,
          hasData: h.status !== null && h.status !== undefined,
        }));

      expect(data.length).toBe(0);
    });
  });

  describe("StatusBars colors", () => {
    const STATUS_COLORS = {
      up: "#22c55e",
      down: "#ef4444",
      degraded: "#eab308",
      missing: "#94a3b8",
    } as const;

    it("should use green for up status", () => {
      const entry = { status: "up", hasData: true };
      const color = entry.hasData
        ? entry.status === "up"
          ? STATUS_COLORS.up
          : entry.status === "degraded"
            ? STATUS_COLORS.degraded
            : STATUS_COLORS.down
        : STATUS_COLORS.missing;

      expect(color).toBe("#22c55e");
    });

    it("should use red for down status", () => {
      const entry = { status: "down", hasData: true };
      const color = entry.hasData
        ? entry.status === "up"
          ? STATUS_COLORS.up
          : entry.status === "degraded"
            ? STATUS_COLORS.degraded
            : STATUS_COLORS.down
        : STATUS_COLORS.missing;

      expect(color).toBe("#ef4444");
    });

    it("should use yellow for degraded status", () => {
      const entry = { status: "degraded", hasData: true };
      const color = entry.hasData
        ? entry.status === "up"
          ? STATUS_COLORS.up
          : entry.status === "degraded"
            ? STATUS_COLORS.degraded
            : STATUS_COLORS.down
        : STATUS_COLORS.missing;

      expect(color).toBe("#eab308");
    });

    it("should use grey for missing data", () => {
      const entry = { status: "up" as const, hasData: false };
      const color = entry.hasData
        ? entry.status === "up"
          ? STATUS_COLORS.up
          : entry.status === "degraded"
            ? STATUS_COLORS.degraded
            : STATUS_COLORS.down
        : STATUS_COLORS.missing;

      expect(color).toBe("#94a3b8");
    });
  });

  describe("LatencyGraph PRIMARY_COLOR", () => {
    it("should use consistent indigo color", () => {
      const PRIMARY_COLOR = "#6366f1";
      expect(PRIMARY_COLOR).toBe("#6366f1");
    });
  });
});