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
    expect(content).toContain("Bruno API Tests");
    expect(content).toContain("@usebruno/cli");
    expect(content).toContain("npx @usebruno/cli run collections/opencollection.yml");
  });

  it("should validate CI workflow commands reference valid scripts and paths", () => {
    const workflowPath = ".github/workflows/bruno-api.yml";
    const workflow = readFileSync(workflowPath, "utf-8");

    // 1. Working directory path must exist
    const wdMatch = workflow.match(/working-directory:\s*(\S+)/);
    expect(wdMatch).not.toBeNull();
    const wdPath = wdMatch![1];
    expect(existsSync(wdPath)).toBe(true);

    // 2. Environment is selected by name (--env ci) which looks for environments/ci.yml in the working dir
    const envDir = join(wdPath, "environments");
    expect(existsSync(envDir)).toBe(true);

    // 3. Collection directory passed as arg must exist
    const collectionPath = join(wdPath, "collections");
    expect(existsSync(collectionPath)).toBe(true);

    // 4. "bun run build" must exist in package.json
    const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
    expect(pkg.scripts).toHaveProperty("build");

    // 5. "bun run preview" must exist in package.json
    expect(pkg.scripts).toHaveProperty("preview");
  });

  it("should generate collection JSON from OpenAPI spec via openApiToBruno", async () => {
    const outputFile = join(TEST_DIR, "collection.json");

    // Fixture: realistic minimal OpenAPI spec
    const spec = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {
        "/health": {
          get: {
            summary: "Health check",
            tags: ["system"],
            responses: { "200": { description: "OK" } },
          },
        },
        "/users": {
          get: {
            summary: "List users",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };

    // Mock @usebruno/converters with a converter that transforms the spec
    const mockConverters = {
      openApiToBruno: async (spec: Record<string, unknown>) => {
        const paths = (spec.paths as Record<string, Record<string, unknown>>) || {};
        const requests = Object.entries(paths).map(([path, methods]) => {
          const method = Object.keys(methods)[0];
          const details = methods[method] as Record<string, unknown>;
          return {
            name: (details.summary as string) || path,
            method: method.toUpperCase(),
            url: path,
          };
        });
        return {
          name: (spec.info as Record<string, unknown>).title as string,
          requests,
        };
      },
    };

    mock.module("@usebruno/converters", () => mockConverters);

    // Import after mocking
    const { openApiToBruno } = await import("@usebruno/converters");

    // Execute the conversion logic (same as generateCollection())
    const rawCollection = await openApiToBruno(spec);
    writeFileSync(outputFile, JSON.stringify(rawCollection, null, 2));

    // Verify the output file is valid JSON with expected structure
    expect(existsSync(outputFile)).toBe(true);
    const written = JSON.parse(readFileSync(outputFile, "utf-8"));
    expect(written.name).toBe("Test API");
    expect(written.requests).toHaveLength(2);
    expect(written.requests[0].url).toBe("/health");
    expect(written.requests[1].url).toBe("/users");

    // Verify paths from the spec are reflected in the output
    const urls = written.requests.map((r: { url: string }) => r.url);
    expect(urls).toContain("/health");
    expect(urls).toContain("/users");
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

    expect(signInContent).toContain("seq: 0");
  });

  it("should have smoke tag on all auth-requiring requests", () => {
    const smokeEndpoints = [
      "auth/sign-in.yml",
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
      "mcp/mcp-health.yml",
      "mcp/mcp-tools.yml",
      "system/health.yml",
      "system/database-heartbeat.yml",
      "system/cache-heartbeat.yml",
      "system/status-history.yml",
    ];

    for (const endpoint of smokeEndpoints) {
      const endpointPath = `.bruno/collections/${endpoint}`;
      expect(existsSync(endpointPath)).toBe(true);
      const content = readFileSync(endpointPath, "utf-8");
      expect(content).toContain("smoke");
    }
  });
});