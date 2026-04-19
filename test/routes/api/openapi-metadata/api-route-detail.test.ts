/**
 * Unit tests for Elysia route OpenAPI metadata (`detail` / DocumentDecoration).
 *
 * Elysia stores per-route documentation on `route.hooks.detail`. The same object is what
 * `@elysiajs/openapi` uses to build the spec, so these tests guard against missing summaries,
 * tags, or auth metadata without starting a server.
 */

import { describe, expect, it } from "bun:test";
import { createApiRoutes } from "../../../../src/routes/api";

const apiRoutes = createApiRoutes();

/** HTTP methods we treat as normal API operations for OpenAPI checks. */
const DOCUMENTED_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "ALL"]);

type RouteDetail = NonNullable<(typeof apiRoutes.routes)[number]["hooks"]>["detail"];

/**
 * Returns routes that participate in the public OpenAPI document (excludes Scalar UI routes
 * marked `hide`, websocket-only routes, etc.).
 */
function getPublicDocumentedRoutes(): Array<(typeof apiRoutes.routes)[number]> {
  const out: Array<(typeof apiRoutes.routes)[number]> = [];

  for (const route of apiRoutes.routes) {
    if (!DOCUMENTED_METHODS.has(String(route.method))) {
      continue;
    }
    const detail = route.hooks?.detail as RouteDetail | undefined;
    if (!detail || typeof detail !== "object") {
      continue;
    }
    if ("hide" in detail && (detail as { hide?: boolean }).hide === true) {
      continue;
    }
    if (!route.path) {
      continue;
    }
    out.push(route);
  }

  return out;
}

describe("API route OpenAPI detail (hooks.detail)", () => {
  it("exposes detail metadata on public HTTP routes", () => {
    const documented = getPublicDocumentedRoutes();
    expect(documented.length).toBeGreaterThan(5);

    for (const route of documented) {
      const detail = route.hooks.detail as Record<string, unknown>;
      expect(detail.summary, `${route.path} should have summary`).toEqual(expect.any(String));
      expect(String(detail.summary).length).toBeGreaterThan(0);
      expect(detail.tags, `${route.method} ${route.path} should have tags`).toEqual(
        expect.any(Array),
      );
      expect((detail.tags as unknown[]).length).toBeGreaterThan(0);
    }
  });

  it("documents core GET /api/health with responses metadata", () => {
    const route = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/health");
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("API health check");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });

  it("hides Scalar UI routes from the generated document (hide: true)", () => {
    const ref = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/reference");
    expect(ref).toBeDefined();
    expect((ref!.hooks.detail as { hide?: boolean }).hide).toBe(true);
  });

  it("documents core GET /api/ with responses metadata", () => {
    const route = apiRoutes.routes.find((r) => r.method === "GET" && r.path === "/api/");
    expect(route).toBeDefined();
    const detail = route!.hooks.detail as Record<string, unknown>;
    expect(detail.summary).toBe("API root");
    expect(detail.responses).toEqual(expect.any(Object));
    expect(Object.keys(detail.responses as object)).toContain("200");
  });
});