/**
 * Contract tests for OpenAPI documentation endpoints.
 * Validates that Scalar Reference UI and OpenAPI JSON spec
 * are exposed correctly.
 */

import { describe, it, expect } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";

const app = apiRoutes;

describe("OpenAPI Documentation", () => {
  it("should expose Scalar reference UI at /api/reference", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/reference`));
    expect(response.status).toBe(200);

    const contentType = response.headers.get("content-type") ?? "";
    expect(contentType).toContain("text/html");

    const body = await response.text();
    expect(body).toContain("<html");
  });

  it("should expose OpenAPI spec JSON at /api/reference/json", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/reference/json`));
    expect(response.status).toBe(200);

    const contentType = response.headers.get("content-type") ?? "";
    expect(contentType).toContain("application/json");

    const body = await response.json();

    expect(body.openapi).toBeDefined();
    expect(body.info).toBeDefined();
    expect(body.info.title).toBeDefined();
    expect(body.paths).toBeDefined();
  });

  it("should document known API routes in OpenAPI spec", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/reference/json`));
    const body = await response.json();

    // Core API endpoints should be documented
    expect(body.paths["/api/"]).toBeDefined();
    expect(body.paths["/api/health"]).toBeDefined();
    expect(body.paths["/api/realtime/health"]).toBeDefined();
  });
});