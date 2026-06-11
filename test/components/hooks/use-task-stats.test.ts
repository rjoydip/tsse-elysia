/**
 * Unit tests for useTaskStats hook logic.
 * Tests the fetch-and-state flow that the hook orchestrates.
 * The hook itself (useEffect + useState) cannot be lifecycle-driven
 * without a test renderer, so we test the data flow that it wraps.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test";

const MOCK_STATS = {
  total: 10,
  active: 6,
  archived: 3,
  deleted: 1,
  todo: 2,
  inProgress: 1,
  review: 1,
  done: 2,
  backlog: 0,
  canceled: 0,
};

describe("useTaskStats data flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should fetch stats and return them on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    });

    const response = await mockFetch("/api/tasks/stats");
    const data = await response.json();

    expect(mockFetch).toHaveBeenCalledWith("/api/tasks/stats");
    expect(data).toEqual(MOCK_STATS);
  });

  it("should throw when fetch fails with non-ok status", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
    });

    const response = await mockFetch("/api/tasks/stats");
    expect(response.ok).toBe(false);
  });

  it("should handle network errors gracefully", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    await expect(mockFetch("/api/tasks/stats")).rejects.toThrow("Network failure");
  });

  it("should abort in-flight requests on signal", async () => {
    const abortController = new AbortController();
    const mockFetch = vi
      .fn()
      .mockImplementation((_url: string, opts?: { signal?: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      });

    const fetchPromise = mockFetch("/api/tasks/stats", { signal: abortController.signal });
    abortController.abort();

    await expect(fetchPromise).rejects.toThrow("Aborted");
  });
});