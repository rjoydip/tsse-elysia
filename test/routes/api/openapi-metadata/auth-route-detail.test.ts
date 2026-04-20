import { describe, expect, it } from "bun:test";
import { createApiRoutes } from "../../../../src/routes/api/$";

const apiRoutes = createApiRoutes();

describe("Auth API route OpenAPI detail (hooks.detail)", () => {
  it("documents auth GET /api/auth/ with responses metadata", () => {
    const route = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/auth/");
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(String(detail.summary).toLowerCase()).toContain("root");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });

  it("documents auth GET /api/auth/health with responses metadata", () => {
    const route = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/auth/health");
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("Auth health check");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });
});