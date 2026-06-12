import { describe, it, expect } from "bun:test";

describe("Real @usebruno/converters integration", () => {
  it("should convert a real OpenAPI spec via openApiToBruno", async () => {
    const fixture = {
      openapi: "3.0.0",
      info: { title: "Real Converter Test", version: "1.0.0" },
      paths: {
        "/health": {
          get: {
            summary: "Health check",
            tags: ["system"],
            responses: { "200": { description: "OK" } },
          },
        },
        "/users": {
          post: {
            summary: "Create user",
            tags: ["users"],
            responses: { "201": { description: "Created" } },
          },
        },
      },
    };

    const { openApiToBruno } = await import("@usebruno/converters");

    const result = (await openApiToBruno(fixture)) as {
      name: string;
      items: Array<{
        name: string;
        items: Array<{
          name: string;
          request?: { url?: string; method?: string };
        }>;
      }>;
    };

    expect(result).toBeDefined();
    expect(result.name).toBe("Real Converter Test");
    expect(result.items).toBeDefined();
    expect(result.items.length).toBeGreaterThanOrEqual(2);

    // Items are folders grouped by OpenAPI tags, each containing the actual requests
    const allRequests = result.items.flatMap((folder) => folder.items || []);
    expect(allRequests.length).toBeGreaterThanOrEqual(2);

    const urls = allRequests.map((r) => r.request?.url || r.name || "");
    expect(urls).toContain("{{baseUrl}}/health");
    expect(urls).toContain("{{baseUrl}}/users");

    const methods = allRequests.map((r) => (r.request?.method || "").toLowerCase());
    expect(methods).toContain("get");
    expect(methods).toContain("post");
  });
});