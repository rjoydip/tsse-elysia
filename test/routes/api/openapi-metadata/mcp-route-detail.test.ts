import { describe, expect, it } from "bun:test";
import { createApiRoutes } from "../../../../src/routes/api/$";

const apiRoutes = createApiRoutes();

describe("MCP API route OpenAPI detail (hooks.detail)", () => {
  it("marks MCP key mutations with bearer security in OpenAPI detail", () => {
    const postKeys = apiRoutes.routes.find(
      (r) => r.method === "POST" && r.path === "/api/mcp/keys/",
    );
    expect(postKeys).toBeDefined();
    const detail = postKeys!.hooks.detail as { security?: unknown };
    expect(detail.security).toEqual([{ bearerAuth: [] }]);
  });

  it("documents mcp GET /api/mcp/ with responses metadata", () => {
    const route = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/mcp/");
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("MCP root");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });

  it("documents mcp GET /api/mcp/health with responses metadata", () => {
    const route = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/mcp/health");
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("MCP health check");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });

  it("documents mcp GET /api/mcp/tools with responses metadata", () => {
    const route = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/mcp/tools");
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("List MCP tools");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });
});