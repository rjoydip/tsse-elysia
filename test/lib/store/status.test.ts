/**
 * Unit tests for status store actions and state transitions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import {
  canTriggerManualRefresh,
  checkStatusHealth,
  getManualRefreshCooldownRemainingMs,
  otherStatusServices,
  refreshStatusHealth,
  statusServices,
  statusStore,
} from "../../../src/lib/stores/status";

/**
 * Total expected fetch calls per health check cycle.
 * Includes all API health endpoints plus other services with heartbeat URLs plus history fetch.
 */
const expectedFetchCount =
  statusServices.length + otherStatusServices.filter((s) => s.heartbeatUrl).length + 1;

/**
 * Restores status store to its deterministic baseline for isolated test execution.
 */
function resetStatusStore(): void {
  statusStore.setState(() => ({
    serviceStatuses: statusServices.map((service) => ({
      name: service.name,
      status: "loading",
      responseTime: null,
      lastChecked: null,
    })),
    otherServiceStatuses: otherStatusServices.map((service) => ({
      name: service.name,
      status: service.heartbeatUrl ? "unknown" : "degraded",
      lastUpdated: null,
      tooltip: service.defaultTooltip,
      latencyMs: null,
      pools: [],
    })),
    isRefreshing: false,
    lastRefreshSuccessful: null,
    lastManualRefreshAt: null,
    history: [],
  }));
}

describe("status store", () => {
  beforeEach(() => {
    resetStatusStore();
    (globalThis.fetch as any).preconnect = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStatusStore();
  });

  it("should initialize with loading state for all status services", () => {
    expect(statusStore.state.serviceStatuses).toHaveLength(statusServices.length);
    expect(statusStore.state.serviceStatuses.every((service) => service.status === "loading")).toBe(
      true,
    );
    const databaseStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Database",
    );
    expect(databaseStatus?.status).toBe("unknown");
    expect(statusStore.state.isRefreshing).toBe(false);
    expect(statusStore.state.lastRefreshSuccessful).toBeNull();
    expect(statusStore.state.lastManualRefreshAt).toBeNull();
  });

  it("should mark all services up when every health endpoint succeeds", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      // @ts-expect-error - Bun fetch type expects preconnect
      .mockImplementation((input: unknown) => {
        const requestUrl = String(input);
        if (requestUrl.includes("/api/database/heartbeat")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                status: "healthy",
                detail: "Database heartbeat query succeeded",
                timestamp: new Date().toISOString(),
                pools: [
                  {
                    name: "primary",
                    role: "primary",
                    healthy: true,
                    latencyMs: 5,
                  },
                  {
                    name: "replica-1",
                    role: "replica",
                    healthy: true,
                    latencyMs: 3,
                  },
                  {
                    name: "replica-2",
                    role: "replica",
                    healthy: true,
                    latencyMs: 4,
                  },
                ],
              }),
              { status: 200 },
            ),
          );
        }
        if (requestUrl.includes("/api/status/history")) {
          return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify({ status: "healthy" }), { status: 200 }),
        );
      });

    await checkStatusHealth();

    expect(fetchMock).toHaveBeenCalledTimes(expectedFetchCount);
    expect(statusStore.state.serviceStatuses.every((service) => service.status === "up")).toBe(
      true,
    );
    const databaseStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Database",
    );
    expect(databaseStatus?.status).toBe("operational");
    expect(databaseStatus?.pools).toHaveLength(3);
    expect(databaseStatus?.pools?.[0].name).toBe("primary");
    expect(databaseStatus?.pools?.[0].role).toBe("primary");
    expect(databaseStatus?.pools?.[1].role).toBe("replica");
    expect(statusStore.state.lastRefreshSuccessful).toBe(true);
    expect(statusStore.state.isRefreshing).toBe(false);
  });

  it("should mark failed services down when fetch rejects", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    // @ts-expect-error - Bun fetch type expects preconnect
    fetchMock.mockImplementation((input: unknown) => {
      const requestUrl = String(input);
      if (requestUrl.includes("/api/auth/health")) {
        return Promise.reject(new Error("network failure"));
      }
      if (requestUrl.includes("/api/database/heartbeat")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "unhealthy",
              detail: "SQLite instance is not initialized",
              timestamp: new Date().toISOString(),
            }),
            { status: 503 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }));
    });

    await checkStatusHealth();

    const authService = statusStore.state.serviceStatuses.find(
      (service) => service.name === "Auth API",
    );
    expect(authService?.status).toBe("down");
    expect(authService?.error).toBe("Connection failed");
    const databaseStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Database",
    );
    expect(databaseStatus?.status).toBe("outage");
    expect(statusStore.state.lastRefreshSuccessful).toBe(false);
    expect(statusStore.state.isRefreshing).toBe(false);
  });

  it("should trigger health check from refreshStatusHealth helper", async () => {
    vi.clearAllMocks();

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      // @ts-expect-error - Bun fetch type expects preconnect
      .mockImplementation((input: unknown) => {
        const requestUrl = String(input);
        if (requestUrl.includes("/api/database/heartbeat")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                status: "healthy",
                detail: "Database heartbeat query succeeded",
                timestamp: new Date().toISOString(),
                pools: [
                  {
                    name: "primary",
                    role: "primary",
                    healthy: true,
                    latencyMs: 5,
                  },
                  {
                    name: "replica-1",
                    role: "replica",
                    healthy: true,
                    latencyMs: 3,
                  },
                  {
                    name: "replica-2",
                    role: "replica",
                    healthy: true,
                    latencyMs: 4,
                  },
                ],
              }),
              { status: 200 },
            ),
          );
        }
        if (requestUrl.includes("/api/status/history")) {
          return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify({ status: "healthy" }), { status: 200 }),
        );
      });

    vi.clearAllMocks();
    const triggered = refreshStatusHealth();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(triggered).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(expectedFetchCount);
  });

  it("should block refresh while a check is already in progress", () => {
    statusStore.setState((prev) => ({ ...prev, isRefreshing: true }));

    const triggered = refreshStatusHealth();

    expect(triggered).toBe(false);
    expect(canTriggerManualRefresh()).toBe(false);
  });

  it("should block rapid refresh calls during cooldown window", () => {
    const now = Date.now();
    statusStore.setState((prev) => ({ ...prev, lastManualRefreshAt: now }));

    const triggered = refreshStatusHealth(now + 1000);
    const remainingMs = getManualRefreshCooldownRemainingMs(now + 1000);

    expect(triggered).toBe(false);
    expect(remainingMs).toBeGreaterThan(0);
  });

  it("should handle database heartbeat network or runtime failure gracefully", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    // @ts-expect-error - Bun fetch types
    fetchMock.mockImplementation((input: unknown) => {
      const requestUrl = String(input);
      if (requestUrl.includes("/api/database/heartbeat")) {
        return Promise.resolve(new Response(JSON.stringify({ status: 123 }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }));
    });

    await checkStatusHealth();

    const databaseStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Database",
    );
    expect(databaseStatus?.status).toBe("outage");
    expect(databaseStatus?.tooltip).toBe(
      "Database heartbeat request failed or returned invalid data.",
    );
  });

  it("should include pool information in tooltip when database has replicas", async () => {
    // @ts-expect-error - Bun type workaround
    vi.spyOn(globalThis, "fetch").mockImplementation((input: unknown) => {
      const requestUrl = String(input);
      if (requestUrl.includes("/api/database/heartbeat")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "healthy",
              detail: "All 3 PostgreSQL pools are healthy",
              timestamp: new Date().toISOString(),
              latencyMs: 10,
              pools: [
                {
                  name: "primary",
                  role: "primary",
                  healthy: true,
                  latencyMs: 5,
                },
                {
                  name: "replica-1",
                  role: "replica",
                  healthy: true,
                  latencyMs: 3,
                },
                {
                  name: "replica-2",
                  role: "replica",
                  healthy: false,
                  error: "Connection timeout",
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }));
    });

    await checkStatusHealth();

    const databaseStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Database",
    );
    expect(databaseStatus?.status).toBe("operational");
    expect(databaseStatus?.pools).toHaveLength(3);
    expect(databaseStatus?.tooltip).toContain("primary: healthy (5ms)");
    expect(databaseStatus?.tooltip).toContain("replica-2: unhealthy");
  });

  it("should include databaseType in Database service response", async () => {
    // @ts-expect-error - Bun type workaround
    vi.spyOn(globalThis, "fetch").mockImplementation((input: unknown) => {
      const requestUrl = String(input);
      if (requestUrl.includes("/api/database/heartbeat")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "healthy",
              detail: "SQLite heartbeat query succeeded",
              timestamp: new Date().toISOString(),
              databaseType: "sqlite",
              latencyMs: 5,
              pools: [
                {
                  name: "sqlite",
                  role: "primary",
                  healthy: true,
                  latencyMs: 5,
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }));
    });

    await checkStatusHealth();

    const databaseStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Database",
    );
    expect(databaseStatus?.databaseType).toBe("sqlite");
  });

  it("should include backend in Cache service response", async () => {
    // @ts-expect-error - Bun type workaround
    vi.spyOn(globalThis, "fetch").mockImplementation((input: unknown) => {
      const requestUrl = String(input);
      if (requestUrl.includes("/api/cache/heartbeat")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "healthy",
              connected: true,
              backend: "redis",
              detail: "Cache heartbeat succeeded",
              timestamp: new Date().toISOString(),
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }));
    });

    await checkStatusHealth();

    const cacheStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Cache",
    );
    expect(cacheStatus?.backend).toBe("redis");
  });

  it("should handle Cache LRU backend type", async () => {
    // @ts-expect-error - Bun type workaround
    vi.spyOn(globalThis, "fetch").mockImplementation((input: unknown) => {
      const requestUrl = String(input);
      if (requestUrl.includes("/api/cache/heartbeat")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "healthy",
              connected: true,
              backend: "lru",
              detail: "LRU cache heartbeat succeeded",
              timestamp: new Date().toISOString(),
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }));
    });

    await checkStatusHealth();

    const cacheStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Cache",
    );
    expect(cacheStatus?.backend).toBe("lru");
  });

  it("should include latencyMs in other services", async () => {
    // @ts-expect-error - Bun type workaround
    vi.spyOn(globalThis, "fetch").mockImplementation((input: unknown) => {
      const requestUrl = String(input);
      if (requestUrl.includes("/api/database/heartbeat")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "healthy",
              detail: "Database heartbeat succeeded",
              timestamp: new Date().toISOString(),
              latencyMs: 15,
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }));
    });

    await checkStatusHealth();

    const databaseStatus = statusStore.state.otherServiceStatuses.find(
      (service) => service.name === "Database",
    );
    expect(databaseStatus?.latencyMs).toBe(15);
  });
});