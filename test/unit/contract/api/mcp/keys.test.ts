/**
 * Contract tests for MCP API Keys endpoints.
 * Validates authentication enforcement for key management operations.
 */

import { describe, it, expect } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { TEST_TOKENS, malformedAuthRequest } from "~/test/helpers/auth";

const app = apiRoutes;

describe("MCP API Keys - Unauthenticated", () => {
  it("should return 401 without auth header", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/keys`));

    expect(response.status).toBe(401);
  });

  it("should return 401 with malformed auth header", async () => {
    const response = await app.handle(malformedAuthRequest(`${BASE_URL}/api/mcp/keys`));

    expect(response.status).toBe(401);
  });

  it("should return 401 without Bearer prefix", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/mcp/keys`, {
        headers: {
          Authorization: TEST_TOKENS.NO_PREFIX,
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("should reject POST without auth", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/mcp/keys`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Test Key" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("should reject PUT without auth", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/mcp/keys/test-key-id`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Updated Key" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("should reject DELETE without auth", async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/api/mcp/keys/test-key-id`, { method: "DELETE" }),
    );

    expect(response.status).toBe(401);
  });
});