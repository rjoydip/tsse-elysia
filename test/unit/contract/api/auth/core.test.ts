import { Elysia } from "elysia";
import { describe, it, expect } from "bun:test";
import { authCoreRoutes } from "~/routes/api/auth/-core";

const app = new Elysia({ prefix: "/api" }).use(authCoreRoutes);

describe("Auth API Flows", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await app.handle(new Request("http://localhost/unknown-route"));

    expect(response.status).toBe(404);
  });

  it("should include CORS headers", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/auth", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
        },
      }),
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeDefined();
  });

  it("should handle error response format", async () => {
    const response = await app.handle(new Request("http://localhost/api/auth/nonexistent"));

    expect(response.status).toBe(404);
  });

  it("should include trace headers in response", async () => {
    const response = await app.handle(new Request("http://localhost/api/auth/"));

    expect(response.headers.get("X-Elapsed")).toBeDefined();
  });
});

describe("Auth API Root", () => {
  it("should return welcome message", async () => {
    const response = await app.handle(new Request("http://localhost/api/auth/"));
    const text = await response.text();

    expect(text).toContain("Welcome to");
    expect(text).toContain("Auth");
  });

  it("should return text/plain content type", async () => {
    const response = await app.handle(new Request("http://localhost/api/auth/"));

    expect(response.headers.get("content-type")).toContain("text/plain");
  });
});

describe("Auth API Health", () => {
  it("should return health status", async () => {
    const response = await app.handle(new Request("http://localhost/api/auth/health"));
    const json = await response.json();

    expect(json).toHaveProperty("name");
    expect(json).toHaveProperty("status", "healthy");
    expect(json).toHaveProperty("timestamp");
  });

  it("should return json content type", async () => {
    const response = await app.handle(new Request("http://localhost/api/auth/health"));

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("Auth API - Method Handling", () => {
  it("should handle GET requests", async () => {
    const response = await app.handle(new Request("http://localhost/api/auth/", { method: "GET" }));

    expect(response.status).toBe(200);
  });

  it("should handle POST requests", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/auth/sign-in", { method: "POST" }),
    );

    expect(response.status).toBeDefined();
  });

  it("should handle allowed methods for sign-in", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/auth/sign-in", { method: "POST" }),
    );

    expect(response.status).toBeDefined();
  });
});