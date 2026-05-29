/**
 * Unit tests for src/middlewares/cors.ts
 * Tests: CORS headers configuration
 */

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { Elysia } from "elysia";
import { cors, corsWithCredentials } from "~/middlewares/cors";
import { corsConfig } from "~/config";

describe("cors middleware", () => {
  let app: Elysia;

  beforeEach(() => {
    app = new Elysia().use(cors);
  });

  afterEach(() => {
    app = undefined as unknown as Elysia;
  });

  it("should be defined as Elysia instance", () => {
    expect(cors).toBeInstanceOf(Elysia);
  });

  it("should set Access-Control-Allow-Origin header", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(corsConfig.origin);
  });

  it("should set Access-Control-Allow-Methods header", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      corsConfig.methods.join(", "),
    );
  });

  it("should set Access-Control-Allow-Headers header", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      corsConfig.allowedHeaders.join(", "),
    );
  });

  it("should set Access-Control-Expose-Headers header", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    expect(response.headers.get("Access-Control-Expose-Headers")).toBe(
      corsConfig.exposedHeaders.join(", "),
    );
  });

  it("should set Access-Control-Max-Age header", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    expect(response.headers.get("Access-Control-Max-Age")).toBe(String(corsConfig.maxAge));
  });

  it("should set Access-Control-Allow-Credentials when credentials is enabled", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    if (corsConfig.credentials) {
      expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    }
  });
});

describe("corsWithCredentials middleware", () => {
  let app: Elysia;

  beforeEach(() => {
    app = new Elysia().use(corsWithCredentials);
  });

  afterEach(() => {
    app = undefined as unknown as Elysia;
  });

  it("should be defined as Elysia instance", () => {
    expect(corsWithCredentials).toBeInstanceOf(Elysia);
  });

  it("should set Access-Control-Allow-Methods header", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
  });

  it("should set Access-Control-Allow-Headers header", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type, Authorization",
    );
  });

  it("should set Access-Control-Allow-Credentials header", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("should use request Origin when available", async () => {
    app = new Elysia().use(corsWithCredentials);
    const response = await app.handle(
      new Request("http://localhost/", {
        method: "GET",
        headers: { Origin: "https://example.com" },
      }),
    );
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
  });
});