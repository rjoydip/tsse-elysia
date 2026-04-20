/**
 * Unit tests for src/middlewares/index.ts
 * Tests: traceFn and errorFn middleware functions
 */

import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { composedMiddleware } from "../../src/middlewares/index";

describe("traceFn", () => {
  it("should be exported from middlewares", async () => {
    const { traceFn } = await import("../../src/middlewares/index");
    expect(traceFn).toBeDefined();
    expect(typeof traceFn).toBe("function");
  });
});

describe("errorFn", () => {
  it("should be exported from middlewares", async () => {
    const { errorFn } = await import("../../src/middlewares/index");
    expect(errorFn).toBeDefined();
    expect(typeof errorFn).toBe("function");
  });

  it("should return Response for NOT_FOUND error", async () => {
    const { errorFn } = await import("../../src/middlewares/index");
    const app = new Elysia().onError(errorFn);

    const response = await app.handle(new Request("http://localhost/test", { method: "GET" }));

    expect(response.status).toBe(404);
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.error).toBe("Endpoint not found");
  });

  it("should return Response for generic error", async () => {
    const { errorFn } = await import("../../src/middlewares/index");
    const app = new Elysia().onError(errorFn).get("/error", () => {
      throw new Error("Test error");
    });

    const response = await app.handle(new Request("http://localhost/error", { method: "GET" }));

    expect(response.status).toBe(500);
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.error).toBeDefined();
  });
});

describe("composedMiddleware", () => {
  it("should be defined as a function", () => {
    expect(typeof composedMiddleware).toBe("function");
  });

  it("should return Elysia instance", () => {
    const middleware = composedMiddleware();
    expect(middleware).toBeInstanceOf(Elysia);
  });

  it("should accept custom openAPP_NAME option", () => {
    const middleware = composedMiddleware({ OPENAPI_NAME: "Custom API" });
    expect(middleware).toBeInstanceOf(Elysia);
  });
});