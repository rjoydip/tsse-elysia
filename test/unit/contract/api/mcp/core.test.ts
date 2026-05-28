/**
 * Integration tests for MCP HTTP routes.
 * Covers route availability, health checks, rate limiting behavior, and tool discovery.
 */
import { Elysia } from "elysia";
import { describe, expect, it } from "bun:test";
import { getMcpServer } from "~/lib/mcp/server";
import { mcpCoreRoutes } from "~/routes/api/mcp/-core";

const app = new Elysia({ prefix: "/api" }).use(mcpCoreRoutes);

describe("MCP API Flows", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/unknown-route"));

    expect(response.status).toBe(404);
  });

  it("should include CORS headers", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/mcp", {
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
    const response = await app.handle(new Request("http://localhost/api/mcp/nonexistent"));

    expect(response.status).toBe(404);
  });

  it("should include trace headers in response", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/"));

    expect(response.headers.get("X-Elapsed")).toBeDefined();
  });
});

describe("MCP API Root", () => {
  it("should return welcome message", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/"));
    const text = await response.text();

    expect(text).toContain("Welcome to");
    expect(text).toContain("MCP");
  });

  it("should return text/plain content type", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/"));

    expect(response.headers.get("content-type")).toContain("text/plain");
  });
});

describe("MCP API Health", () => {
  it("should return health status", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/health"));
    const json = await response.json();

    expect(json).toHaveProperty("status", "healthy");
    expect(json).toHaveProperty("activeConnections");
    expect(json).toHaveProperty("timestamp");
  });

  it("should return json content type", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/health"));

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should rate limit repeated health probes from the same requester", async () => {
    let limitedResponse: Response | null = null;

    for (let i = 0; i < 80; i++) {
      const response = await app.handle(
        new Request("http://localhost/api/mcp/health", {
          headers: {
            "x-forwarded-for": "198.51.100.10",
          },
        }),
      );
      if (response.status === 429) {
        limitedResponse = response;
        break;
      }
    }

    expect(limitedResponse).not.toBeNull();
    expect(limitedResponse?.headers.get("Retry-After")).toBeDefined();
    expect(limitedResponse?.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(limitedResponse?.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("should isolate health rate limit buckets per requester", async () => {
    // Exhaust one requester bucket first.
    for (let i = 0; i < 70; i++) {
      await app.handle(
        new Request("http://localhost/api/mcp/health", {
          headers: {
            "x-forwarded-for": "203.0.113.20",
          },
        }),
      );
    }

    // A different requester should still be served normally.
    const freshRequesterResponse = await app.handle(
      new Request("http://localhost/api/mcp/health", {
        headers: {
          "x-forwarded-for": "203.0.113.21",
        },
      }),
    );

    expect(freshRequesterResponse.status).toBe(200);
  });
});

describe("MCP API Tools", () => {
  it("should return list of MCP tools", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/tools"));
    const json = await response.json();

    expect(json).toHaveProperty("tools");
    expect(Array.isArray(json.tools)).toBe(true);
    expect(json.tools.length).toBeGreaterThan(0);
  });

  it("should include auth-related tools", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/tools"));
    const json = await response.json();

    const authTools = json.tools.filter((tool: { category: string }) => tool.category === "auth");
    expect(authTools.length).toBeGreaterThan(0);
  });

  it("should match currently registered MCP server tool names", async () => {
    // Route should expose the live registered tool list to avoid static drift.
    const response = await app.handle(new Request("http://localhost/api/mcp/tools"));
    const json = await response.json();
    const server = getMcpServer() as unknown as {
      _registeredTools?: Record<string, unknown>;
    };

    const responseNames = json.tools.map((tool: { name: string }) => tool.name).sort();
    const registeredNames = Object.keys(server._registeredTools ?? {}).sort();

    expect(responseNames).toEqual(registeredNames);
  });

  it("should include user-related tools", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/tools"));
    const json = await response.json();

    const userTools = json.tools.filter((tool: { category: string }) => tool.category === "users");
    expect(userTools.length).toBeGreaterThan(0);
  });

  it("should include organization-related tools", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/tools"));
    const json = await response.json();

    const orgTools = json.tools.filter(
      (tool: { category: string }) => tool.category === "organization",
    );
    expect(orgTools.length).toBeGreaterThan(0);
  });

  it("should have proper tool structure", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/tools"));
    const json = await response.json();

    const tool = json.tools[0];
    expect(tool).toHaveProperty("name");
    expect(tool).toHaveProperty("title");
    expect(tool).toHaveProperty("description");
    expect(tool).toHaveProperty("category");
  });

  it("should return json content type for tools", async () => {
    const response = await app.handle(new Request("http://localhost/api/mcp/tools"));

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});