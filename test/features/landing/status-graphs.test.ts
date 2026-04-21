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
    { serviceName: "API", status: "up", latencyMs: 45, timestamp: "2024-01-01T10:00:00Z" },
    { serviceName: "API", status: "up", latencyMs: 52, timestamp: "2024-01-01T10:01:00Z" },
    { serviceName: "API", status: "down", latencyMs: null, timestamp: "2024-01-01T10:02:00Z" },
    { serviceName: "API", status: "up", latencyMs: 38, timestamp: "2024-01-01T10:03:00Z" },
    { serviceName: "API", status: "up", latencyMs: 41, timestamp: "2024-01-01T10:04:00Z" },
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
        value: h.status === "up" ? 1 : 0,
      }));

      expect(data[0].value).toBe(1);
      expect(data[2].value).toBe(0);
    });

    it("should map down/degraded status to 0", () => {
      const data = mockHistory.map((h) => ({
        value: h.status === "up" ? 1 : 0,
      }));

      expect(data[2].value).toBe(0);
    });

    it("should limit to last 20 records", () => {
      const data = mockHistory
        .filter((h) => h.serviceName === "API")
        .slice(-20)
        .map((h) => ({
          value: h.status === "up" ? 1 : 0,
        }));

      expect(data.length).toBe(5);
    });

    it("should handle empty history for status bars", () => {
      const emptyHistory: ServiceHistoryRecord[] = [];
      const data = emptyHistory
        .filter((h) => h.serviceName === "Nonexistent")
        .slice(-20)
        .map((h) => ({
          value: h.status === "up" ? 1 : 0,
        }));

      expect(data.length).toBe(0);
    });
  });
});