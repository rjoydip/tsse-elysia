/**
 * Contract tests for MCP Core HTTP routes.
 * Covers route availability, health checks, rate limiting behavior, and tool discovery.
 *
 * Uses `new Elysia().use(mcpCoreRoutes)` to test the MCP core module in isolation,
 * bypassing the full app assembly. This allows mocking the rate limiter directly
 * without affecting other tests.
 *
 * Full-stack MCP endpoint tests are in mcp/endpoints.test.ts (uses apiRoutes).
 */
import { Elysia } from "elysia";
import { describe, expect, it, vi } from "bun:test";
import { BASE_URL } from "~/test/helpers/request";

// Mock the health rate limiter so we don't send 61 sequential requests per test.
const mockGetHealthRateLimitResponse = vi.fn<(...args: any[]) => Response | null>(() => null);

vi.mock("~/services/mcp/rate-limiter", () => ({
  getHealthRateLimitResponse: mockGetHealthRateLimitResponse,
}));

import { getMcpServer } from "~/lib/mcp/server";
import { mcpCoreRoutes } from "~/routes/api/mcp/-core";

const app = new Elysia({ prefix: "/api" }).use(mcpCoreRoutes);

describe("MCP API Flows", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/unknown-route`));

    expect(response.status).toBe(404);
  });

  it("should include CORS headers", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/mcp`, {
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
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/nonexistent`));

    expect(response.status).toBe(404);
  });

  it("should include trace headers in response", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/`));

    expect(response.headers.get("X-Elapsed")).toBeDefined();
  });
});

describe("MCP API Root", () => {
  it("should return welcome message", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/`));
    const text = await response.text();

    expect(text).toContain("Welcome to");
    expect(text).toContain("MCP");
  });

  it("should return text/plain content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/`));

    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
  });
});

describe("MCP API Health", () => {
  it("should return health status", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/health`));
    const json = await response.json();

    expect(json).toHaveProperty("status", "healthy");
    expect(json).toHaveProperty("activeConnections");
    expect(json).toHaveProperty("timestamp");
  });

  it("should return json content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/health`));

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should return 429 with proper headers when rate limited", async () => {
    // Simulate rate-limit hit without sending 61 sequential requests
    mockGetHealthRateLimitResponse.mockReturnValueOnce(
      new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          limit: 60,
          resetAt: new Date(Date.now() + 60000).toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
          },
        },
      ),
    );

    const response = await app.handle(
      new Request(`${BASE_URL}/api/mcp/health`, {
        headers: { "x-forwarded-for": "198.51.100.10" },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeDefined();
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("should allow normal requests after rate-limited requester", async () => {
    // First requester triggers rate limit (simulated without 61 sequential requests)
    mockGetHealthRateLimitResponse.mockReturnValueOnce(
      new Response("rate limited", { status: 429 }),
    );

    const response1 = await app.handle(
      new Request(`${BASE_URL}/api/mcp/health`, {
        headers: { "x-forwarded-for": "203.0.113.20" },
      }),
    );
    expect(response1.status).toBe(429);

    // Second requester (different identity) is allowed through
    mockGetHealthRateLimitResponse.mockReturnValueOnce(null);

    const response2 = await app.handle(
      new Request(`${BASE_URL}/api/mcp/health`, {
        headers: { "x-forwarded-for": "203.0.113.21" },
      }),
    );
    expect(response2.status).toBe(200);
  });
});

describe("MCP API Tools", () => {
  it("should return list of MCP tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const json = await response.json();

    expect(json).toHaveProperty("tools");
    expect(Array.isArray(json.tools)).toBe(true);
    expect(json.tools.length).toBeGreaterThan(0);
  });

  it("should include auth-related tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const json = await response.json();

    const authTools = json.tools.filter((tool: { category: string }) => tool.category === "auth");
    expect(authTools.length).toBeGreaterThan(0);
  });

  it("should match currently registered MCP server tool names", async () => {
    // Route should expose the live registered tool list to avoid static drift.
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const json = await response.json();
    const server = getMcpServer() as unknown as {
      _registeredTools?: Record<string, unknown>;
    };

    const responseNames = json.tools.map((tool: { name: string }) => tool.name).sort();
    const registeredNames = Object.keys(server._registeredTools ?? {}).sort();

    expect(responseNames).toEqual(registeredNames);
  });

  it("should include user-related tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const json = await response.json();

    const userTools = json.tools.filter((tool: { category: string }) => tool.category === "users");
    expect(userTools.length).toBeGreaterThan(0);
  });

  it("should include organization-related tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const json = await response.json();

    const orgTools = json.tools.filter(
      (tool: { category: string }) => tool.category === "organization",
    );
    expect(orgTools.length).toBeGreaterThan(0);
  });

  it("should have proper tool structure", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const json = await response.json();

    const tool = json.tools[0];
    expect(tool).toHaveProperty("name");
    expect(tool).toHaveProperty("title");
    expect(tool).toHaveProperty("description");
    expect(tool).toHaveProperty("category");
  });

  it("should return json content type for tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});