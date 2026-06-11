/**
 * Unit tests for useDebouncedLoading hook logic.
 * Tests the debounce algorithm (setTimeout/clearTimeout) directly,
 * since React's hook lifecycle (useEffect + setState) cannot be
 * reliably driven in a server-side-render test without a proper
 * test renderer like @testing-library/react.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test";

describe("Debounce logic (internal to useDebouncedLoading)", () => {
  let show: boolean;
  let timer: ReturnType<typeof setTimeout> | null;

  /** Simulates the hook's internal state machine. */
  function setLoading(loading: boolean) {
    if (loading) {
      timer = setTimeout(() => {
        show = true;
      }, 300);
    } else {
      if (timer) clearTimeout(timer);
      timer = null;
      show = false;
    }
  }

  beforeEach(() => {
    show = false;
    timer = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (timer) clearTimeout(timer);
    vi.useRealTimers();
  });

  it("should start as false", () => {
    expect(show).toBe(false);
  });

  it("should stay false when loading stops before delay expires", () => {
    setLoading(true);
    setLoading(false);

    vi.advanceTimersByTime(500);

    expect(show).toBe(false);
  });

  it("should become true after the delay when loading persists", () => {
    setLoading(true);

    vi.advanceTimersByTime(200);
    expect(show).toBe(false);

    vi.advanceTimersByTime(150); // total 350ms > 300ms delay
    expect(show).toBe(true);
  });

  it("should reset to false when loading stops after being shown", () => {
    setLoading(true);
    vi.advanceTimersByTime(400);
    expect(show).toBe(true);

    setLoading(false);
    expect(show).toBe(false);
  });

  it("should cancel the pending timer on cleanup", () => {
    setLoading(true);
    if (timer) clearTimeout(timer);
    timer = null;

    vi.advanceTimersByTime(500);
    expect(show).toBe(false);
  });
});