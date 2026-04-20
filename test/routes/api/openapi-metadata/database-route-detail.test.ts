import { describe, expect, it } from "bun:test";
import { createApiRoutes } from "../../../../src/routes/api/$";

const apiRoutes = createApiRoutes();

describe("Database API route OpenAPI detail (hooks.detail)", () => {
  it("documents database GET /api/database/heartbeat with responses metadata", () => {
    const route = apiRoutes.routes.find(
      (r) => r.method === "GET" && r.path === "/api/database/heartbeat",
    );
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("Database heartbeat");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
    expect(Object.keys(detail.responses as object)).toContain("503");
  });
});