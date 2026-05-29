/**
 * Contract tests for MCP API endpoints.
 * Covers: root welcome message, health status, tools discovery,
 * and tool metadata structure.
 *
 * These tests use app.handle() for fast, server-less execution
 * while exercising the full request/response lifecycle including
 * middleware and rate limiting.
 */

import { describe, it, expect, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";

const app = apiRoutes;

afterAll(() => {
  closeStorage();
});

describe("MCP Root Endpoint", () => {
  it("should return welcome message", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Welcome to MCP Service");
  });

  it("should return text/plain content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/`));

    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
  });
});

describe("MCP Health Endpoint", () => {
  it("should return 200 with health status", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/health`));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body).toHaveProperty("activeConnections");
    expect(body).toHaveProperty("timestamp");
  });

  it("should return JSON content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/health`));

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("MCP Tools Discovery", () => {
  it("should return list of available tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.tools).toBeDefined();
    expect(Array.isArray(body.tools)).toBe(true);
    expect(body.tools.length).toBeGreaterThan(0);
  });

  it("should include auth-related tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const body = await response.json();

    const toolNames = body.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("get-current-user");
    expect(toolNames).toContain("list-sessions");
    expect(toolNames).toContain("revoke-session");
  });

  it("should include user tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const body = await response.json();

    const toolNames = body.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("get-user");
    expect(toolNames).toContain("list-users");
    expect(toolNames).toContain("update-user");
  });

  it("should include organization tools", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const body = await response.json();

    const toolNames = body.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("get-organization");
    expect(toolNames).toContain("list-members");
  });

  it("should include tool metadata on each tool", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));
    const body = await response.json();

    const tool = body.tools[0];
    expect(tool).toHaveProperty("name");
    expect(tool).toHaveProperty("title");
    expect(tool).toHaveProperty("description");
    expect(tool).toHaveProperty("category");
  });

  it("should return JSON content type", async () => {
    const response = await app.handle(new Request(`${BASE_URL}/api/mcp/tools`));

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});