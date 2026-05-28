/**
 * Unit tests for src/hooks/use-recent-users.ts
 * Tests: shouldLoadMore guard, fetchUserPage integration with mocked fetch.
 */

import { afterEach, describe, expect, it, vi } from "bun:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  shouldLoadMore,
  fetchUserPage,
  processPage,
  handleFetchError,
  useRecentUsers,
} from "~/hooks/use-recent-users";

/**
 * Captures the value of a hook outside a React component by rendering a thin wrapper.
 * Works without a DOM environment via react-dom/server.
 * @returns an object with a `current` getter that reflects the latest hook value.
 */
function renderHookServer<T>(useHook: () => T): { readonly current: T } {
  let current!: T;
  function TestComponent() {
    current = useHook();
    return createElement("div");
  }
  renderToString(createElement(TestComponent));
  return {
    get current() {
      return current;
    },
  };
}

describe("shouldLoadMore", () => {
  it("should return true when all conditions are met", () => {
    expect(shouldLoadMore(true, false, undefined, 0)).toBe(true);
  });

  it("should return false when hasMore is false", () => {
    expect(shouldLoadMore(false, false, undefined, 0)).toBe(false);
  });

  it("should return false when currently loading", () => {
    expect(shouldLoadMore(true, true, undefined, 0)).toBe(false);
  });

  it("should return false when offset reaches max cap", () => {
    expect(shouldLoadMore(true, false, 10, 10)).toBe(false);
    expect(shouldLoadMore(true, false, 10, 15)).toBe(false);
  });

  it("should return true when offset is below max cap", () => {
    expect(shouldLoadMore(true, false, 10, 5)).toBe(true);
  });

  it("should handle max=0 correctly (not falsy)", () => {
    expect(shouldLoadMore(true, false, 0, 0)).toBe(false);
    expect(shouldLoadMore(true, false, 0, -1)).toBe(true);
  });
});

describe("fetchUserPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch users with correct query params", async () => {
    const mockResponse = {
      recentUsers: [
        {
          id: "1",
          avatarSrc: "",
          fallback: "U1",
          name: "User 1",
          email: "user1@test.com",
          role: "user",
          timestamp: Date.now(),
        },
      ],
    };
    let capturedUrl = "";

    vi.spyOn(globalThis as any, "fetch").mockImplementation((input: unknown) => {
      capturedUrl = typeof input === "string" ? input : (input as Request).url;
      return Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }));
    });

    const result = await fetchUserPage(5, 10, new AbortController().signal);

    expect(capturedUrl).toContain("/api/dashboard/recent-activity/users");
    expect(capturedUrl).toContain("limit=5");
    expect(capturedUrl).toContain("offset=10");
    expect(result).toEqual([
      {
        id: "1",
        avatarSrc: "",
        fallback: "U1",
        name: "User 1",
        email: "user1@test.com",
        role: "user",
        timestamp: expect.any(Number),
      },
    ]);
  });

  it("should default to empty array when response has no recentUsers", async () => {
    vi.spyOn(globalThis as any, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
    );

    const result = await fetchUserPage(5, 0, new AbortController().signal);
    expect(result).toEqual([]);
  });

  it("should throw on non-ok response", async () => {
    vi.spyOn(globalThis as any, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(null, { status: 500, statusText: "Server Error" })),
    );

    await expect(fetchUserPage(5, 0, new AbortController().signal)).rejects.toThrow(
      "Failed to fetch recent users: Server Error",
    );
  });

  it("should abort when signal is aborted before fetch", async () => {
    const controller = new AbortController();
    controller.abort();

    vi.spyOn(globalThis as any, "fetch").mockImplementation(
      (_: unknown, init: RequestInit | undefined) => {
        // Simulate real fetch behavior: already-aborted signal rejects immediately
        if (init?.signal?.aborted) {
          return Promise.reject(new DOMException("The operation was aborted", "AbortError"));
        }
        return Promise.resolve(new Response(JSON.stringify({ recentUsers: [] }), { status: 200 }));
      },
    );

    await expect(fetchUserPage(5, 0, controller.signal)).rejects.toThrow("operation was aborted");
  });

  it("should abort when signal is aborted mid-request", async () => {
    const controller = new AbortController();
    let fetchCalled = false;

    vi.spyOn(globalThis as any, "fetch").mockImplementation(
      (_: unknown, init: RequestInit | undefined) => {
        fetchCalled = true;
        // Return a pending promise; abort event will reject it
        return new Promise((_resolve, reject) => {
          const onAbort = () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          };
          if (init?.signal?.aborted) {
            onAbort();
            return;
          }
          init?.signal?.addEventListener("abort", onAbort);
        });
      },
    );

    // Start fetch first, then abort mid-flight
    const fetchPromise = fetchUserPage(5, 0, controller.signal);
    controller.abort();

    await expect(fetchPromise).rejects.toThrow("operation was aborted");
    expect(fetchCalled).toBe(true);
  });
});

describe("processPage", () => {
  it("should append new users and update offset", () => {
    const loadingRef = { current: true };
    const offsetRef = { current: 0 };
    const setRecentUsers = vi.fn();
    const setHasMore = vi.fn();
    const setLoading = vi.fn();
    const signal = new AbortController().signal;

    processPage(
      [
        {
          id: "1",
          avatarSrc: "",
          fallback: "U1",
          name: "A",
          email: "a@t.com",
          role: "user",
          timestamp: 1,
        },
      ],
      10,
      signal,
      loadingRef,
      offsetRef,
      setRecentUsers,
      setHasMore,
      setLoading,
    );

    expect(setRecentUsers).toHaveBeenCalledTimes(1);
    expect(offsetRef.current).toBe(1);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(loadingRef.current).toBe(false);
  });

  it("should set hasMore false when fewer users than limit returned", () => {
    const loadingRef = { current: true };
    const offsetRef = { current: 0 };
    const setRecentUsers = vi.fn();
    const setHasMore = vi.fn();
    const setLoading = vi.fn();
    const signal = new AbortController().signal;

    processPage([], 10, signal, loadingRef, offsetRef, setRecentUsers, setHasMore, setLoading);

    expect(setHasMore).toHaveBeenCalledWith(false);
  });

  it("should bail out when signal is aborted", () => {
    const loadingRef = { current: true };
    const offsetRef = { current: 0 };
    const setRecentUsers = vi.fn();
    const setHasMore = vi.fn();
    const setLoading = vi.fn();
    const controller = new AbortController();
    controller.abort();

    processPage(
      [
        {
          id: "1",
          avatarSrc: "",
          fallback: "U1",
          name: "A",
          email: "a@t.com",
          role: "user",
          timestamp: 1,
        },
      ],
      10,
      controller.signal,
      loadingRef,
      offsetRef,
      setRecentUsers,
      setHasMore,
      setLoading,
    );

    expect(setRecentUsers).not.toHaveBeenCalled();
    expect(loadingRef.current).toBe(false);
  });
});

describe("handleFetchError", () => {
  it("should set error message from Error instance", () => {
    const loadingRef = { current: true };
    const setError = vi.fn();
    const setLoading = vi.fn();
    const signal = new AbortController().signal;

    handleFetchError(new Error("network failure"), signal, loadingRef, setError, setLoading);

    expect(setError).toHaveBeenCalledWith("network failure");
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(loadingRef.current).toBe(false);
  });

  it("should use default message when error is not an Error instance", () => {
    const loadingRef = { current: true };
    const setError = vi.fn();
    const setLoading = vi.fn();
    const signal = new AbortController().signal;

    handleFetchError("string error", signal, loadingRef, setError, setLoading);

    expect(setError).toHaveBeenCalledWith("Failed to fetch recent users");
  });

  it("should bail out on aborted signal", () => {
    const loadingRef = { current: true };
    const setError = vi.fn();
    const setLoading = vi.fn();
    const controller = new AbortController();
    controller.abort();

    handleFetchError(new Error("fail"), controller.signal, loadingRef, setError, setLoading);

    expect(setError).not.toHaveBeenCalled();
    expect(loadingRef.current).toBe(false);
  });
});

describe("useRecentUsers (integration)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should start with loading state, no data, and hasMore true", () => {
    const state = renderHookServer(() => useRecentUsers(5));

    expect(state.current.recentUsers).toEqual([]);
    expect(state.current.isFetching).toBe(true);
    expect(state.current.error).toBeNull();
    expect(state.current.hasMore).toBe(true);
    expect(typeof state.current.loadMore).toBe("function");
  });

  it("should set fetch function as loadMore", () => {
    const state = renderHookServer(() => useRecentUsers(5));

    expect(typeof state.current.loadMore).toBe("function");
  });
});