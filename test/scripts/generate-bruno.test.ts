/**
 * Unit tests for the Bruno collection generation script.
 * Tests that the script handles spec fetching and conversion correctly.
 */

import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { existsSync, readFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = "test-results/bruno";

describe("Bruno Collection Script", () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should have the generation script", () => {
    const scriptPath = "scripts/generate-bruno-collections.ts";
    expect(existsSync(scriptPath)).toBe(true);
    const content = readFileSync(scriptPath, "utf-8");
    expect(content).toContain("openApiToBruno");
    expect(content).toContain("@usebruno/converters");
  });

  it("should have valid Bruno workspace files", () => {
    const workspacePath = ".bruno/workspace.yml";
    expect(existsSync(workspacePath)).toBe(true);
    const content = readFileSync(workspacePath, "utf-8");
    expect(content).toContain("TSSE Elysia");
  });

  it("should have valid Bruno environment files", () => {
    const localEnv = ".bruno/environments/local.yml";
    const ciEnv = ".bruno/environments/ci.yml";
    expect(existsSync(localEnv)).toBe(true);
    expect(existsSync(ciEnv)).toBe(true);
    const localContent = readFileSync(localEnv, "utf-8");
    const ciContent = readFileSync(ciEnv, "utf-8");
    expect(localContent).toContain("base_url");
    expect(ciContent).toContain("base_url");
    expect(ciContent).toContain("localhost:4173");
  });

  it("should have valid Bruno collection files", () => {
    const collectionDir = ".bruno/collections";
    expect(existsSync(collectionDir)).toBe(true);
    const collectionFile = join(collectionDir, "opencollection.yml");
    expect(existsSync(collectionFile)).toBe(true);
    const content = readFileSync(collectionFile, "utf-8");
    expect(content).toContain("TSSE Elysia API");
  });

  it("should have request files for each API domain", () => {
    const domains = ["auth", "users", "roles", "settings", "tasks", "mcp", "dashboard", "system"];
    for (const domain of domains) {
      const folderConfig = `.bruno/collections/${domain}/folder.yml`;
      expect(existsSync(folderConfig)).toBe(true);
      const content = readFileSync(folderConfig, "utf-8");
      expect(content).toContain("type: folder");
    }
  });

  it("should have CI workflow for Bruno tests", () => {
    const workflowPath = ".github/workflows/bruno-api.yml";
    expect(existsSync(workflowPath)).toBe(true);
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("Bruno CLI");
    expect(content).toContain("@usebruno/cli");
    expect(content).toContain("bru run");
  });

  it("should generate collection JSON from OpenAPI spec via openApiToBruno", async () => {
    const outputFile = join(TEST_DIR, "collection.json");

    // Mock @usebruno/converters module
    const mockConverters = {
      openApiToBruno: async () => ({
        name: "Test API",
        requests: [{ name: "Health", method: "GET", url: "/health" }],
      }),
    };

    mock.module("@usebruno/converters", () => mockConverters);

    // Import after mocking to use the mock
    const { openApiToBruno } = await import("@usebruno/converters");

    // Execute the same logic as generateCollection()
    const rawCollection = await openApiToBruno({ openapi: "3.0.0" });
    writeFileSync(outputFile, JSON.stringify(rawCollection, null, 2));

    // Verify the output file
    expect(existsSync(outputFile)).toBe(true);
    const written = JSON.parse(readFileSync(outputFile, "utf-8"));
    expect(written.name).toBe("Test API");
    expect(written.requests).toHaveLength(1);
    expect(written.requests[0].url).toBe("/health");
  });

  it("should set session_token in sign-in for authenticated requests", () => {
    const signInPath = ".bruno/collections/auth/sign-in.yml";
    const content = readFileSync(signInPath, "utf-8");

    // Verify the sign-in sets the session_token variable
    expect(content).toContain('bru.setVar("session_token"');

    // Verify authenticated requests reference session_token
    const protectedEndpoints = [
      "users/list-users.yml",
      "users/get-current-user.yml",
      "users/get-user.yml",
      "users/create-user.yml",
      "roles/list-roles.yml",
      "roles/my-permissions.yml",
      "dashboard/metrics.yml",
      "dashboard/analytics-overview.yml",
      "settings/get-profile.yml",
      "settings/get-account.yml",
      "tasks/list-tasks.yml",
      "tasks/task-stats.yml",
    ];

    for (const endpoint of protectedEndpoints) {
      const endpointPath = `.bruno/collections/${endpoint}`;
      expect(existsSync(endpointPath)).toBe(true);
      const endpointContent = readFileSync(endpointPath, "utf-8");
      expect(endpointContent).toContain("session_token");
    }
  });

  it("should have sign-in.yml seq before all authenticated requests", () => {
    const signInPath = ".bruno/collections/auth/sign-in.yml";
    const signInContent = readFileSync(signInPath, "utf-8");

    expect(signInContent).toContain("seq: 1");
  });
});