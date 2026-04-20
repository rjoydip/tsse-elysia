/**
 * Unit tests for evlog Elysia plugin.
 * Tests: Request logging, timing, error tracking, and log ingestion.
 */

import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { evlogPlugin, evlogIngestEndpoint } from "../../src/plugins/evlog-plugin";

describe("evlogPlugin", () => {
  it("should log successful requests", async () => {
    const drainMock = mock(async () => {});
    const app = new Elysia()
      .use(
        evlogPlugin({
          drainFn: drainMock,
        }),
      )
      .get("/test", () => "OK");

    const response = await app.handle(new Request("http://localhost/test"));
    expect(response.status).toBe(200);

    // Should call drain for request (before) and response (after)
    expect(drainMock.mock.calls.length).toBeGreaterThan(0);

    const requestCall = (drainMock.mock.calls as any[]).find(
      (c: any) => c[0].event.event === "request",
    );
    expect(requestCall).toBeDefined();
    expect(requestCall[0].event.path).toBe("/test");
    expect(requestCall[0].event.method).toBe("GET");
  });

  it("should respect excludePaths", async () => {
    const drainMock = mock(async () => {});
    const app = new Elysia()
      .use(
        evlogPlugin({
          drainFn: drainMock,
          excludePaths: ["/health"],
        }),
      )
      .get("/health", () => "OK");

    await app.handle(new Request("http://localhost/health"));
    expect(drainMock).not.toHaveBeenCalled();
  });

  it("should log errors", async () => {
    const drainMock = mock(async () => {});
    const app = new Elysia()
      .use(
        evlogPlugin({
          drainFn: drainMock,
          logErrors: true,
        }),
      )
      .get("/error", () => {
        throw new Error("Test error");
      });

    await app.handle(new Request("http://localhost/error"));

    const errorCall = (drainMock.mock.calls as any[]).find(
      (c: any) => c[0].event.event === "error",
    );
    expect(errorCall).toBeDefined();
    expect(errorCall[0].event.error).toBe("Test error");
    expect(errorCall[0].event.path).toBe("/error");
  });

  it("should handle duration tracking correctly", async () => {
    const drainMock = mock(async () => {});
    const app = new Elysia()
      .use(
        evlogPlugin({
          drainFn: drainMock,
          logTiming: true,
        }),
      )
      .get("/slow", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "OK";
      });

    await app.handle(new Request("http://localhost/slow"));

    const responseCall = (drainMock.mock.calls as any[]).find(
      (c: any) => c[0].event.duration !== undefined,
    );
    expect(responseCall).toBeDefined();
    expect(responseCall[0].event.duration).toBeGreaterThanOrEqual(10);
  });
});

describe("evlogIngestEndpoint", () => {
  it("should ingest logs correctly", async () => {
    const drainMock = mock(async () => {});
    const app = new Elysia().use(
      evlogIngestEndpoint({
        drainFn: drainMock,
      }),
    );

    const payload = [{ event: "click", element: "button" }, { event: "page_view" }];

    const response = await app.handle(
      new Request("http://localhost/_evlog/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(204);
    expect(drainMock).toHaveBeenCalledWith(payload);
  });

  it("should return 400 for non-array payload", async () => {
    const app = new Elysia().use(evlogIngestEndpoint());

    const response = await app.handle(
      new Request("http://localhost/_evlog/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "not-an-array" }),
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Batch must be an array");
  });

  it("should return 400 for oversized batch", async () => {
    const app = new Elysia().use(evlogIngestEndpoint({ maxBatchSize: 2 }));

    const payload = [{ a: 1 }, { b: 2 }, { c: 3 }];
    const response = await app.handle(
      new Request("http://localhost/_evlog/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("exceeds limit");
  });

  it("should return 400 for invalid JSON", async () => {
    const app = new Elysia().use(evlogIngestEndpoint());

    const response = await app.handle(
      new Request("http://localhost/_evlog/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid JSON payload");
  });
});