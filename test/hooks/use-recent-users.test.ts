/**
 * Unit tests for src/hooks/use-recent-users.ts
 * Tests: shouldLoadMore guard, fetchUserPage integration with mocked fetch.
 */

import { afterEach, describe, expect, it, vi } from "bun:test";
import { shouldLoadMore, fetchUserPage } from "~/hooks/use-recent-users";

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