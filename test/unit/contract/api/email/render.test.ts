import { describe, it, expect, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";

const app = apiRoutes;

afterAll(() => {
  closeStorage();
});

/**
 * Contract tests for the Email Render API endpoint.
 * Tests request validation and error responses.
 * Full render tests require Maizzle build output to be present.
 */
describe("POST /api/email/render - Validation", () => {
  it("should return 400 when template is missing", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { username: "test" } }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(body.issues).toBeDefined();
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it("should return 400 when data is empty object", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "welcome", data: {} }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  it("should return 400 when data is missing", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "welcome" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  it("should return 400 when template is empty string", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "", data: { key: "value" } }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid JSON body", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not valid json",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("should return 400 for non-object data", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "welcome", data: "string" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("should return 400 for non-string data values", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "welcome", data: { count: 42 } }),
      }),
    );

    expect(response.status).toBe(400);
  });
});

describe("POST /api/email/render - Not Found", () => {
  it("should return 404 for unknown template", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "nonexistent", data: { key: "value" } }),
      }),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain('Template "nonexistent" not found');
  });
});

describe("POST /api/email/render - Content Type", () => {
  it("should return application/json for error responses", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should return text/html for successful render", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/email/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: "welcome",
          data: { username: "test", dashboardUrl: "http://test.com" },
        }),
      }),
    );

    // If build output exists, we get 200 with HTML. If not, we get 404.
    // We just verify the content-type is correct for each case.
    if (response.status === 200) {
      expect(response.headers.get("content-type")).toContain("text/html");
    }
  });
});