import { describe, expect, it } from "bun:test";
import { createApiRoutes } from "../../../../src/routes/api/$";

const apiRoutes = createApiRoutes();

describe("Realtime API route OpenAPI detail (hooks.detail)", () => {
  it("documents realtime GET /api/realtime/ with responses metadata", () => {
    const route = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/realtime/");
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("Realtime endpoint discovery");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });

  it("documents realtime GET /api/realtime/health with responses metadata", () => {
    const route = apiRoutes.routes.find(
      (r) => r.method === "GET" && r.path === "/api/realtime/health",
    );
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("Realtime health check");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });
});