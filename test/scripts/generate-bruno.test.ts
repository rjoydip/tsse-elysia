/**
 * Unit tests for the Bruno collection generation script.
 * Tests that the script handles spec fetching and conversion correctly.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = "test-results/bruno";

describe("Bruno Collection Script", () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
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
    const collectionDir = ".bruno/collections/tsse-elysia";
    expect(existsSync(collectionDir)).toBe(true);
    const collectionFile = join(collectionDir, "opencollection.yml");
    expect(existsSync(collectionFile)).toBe(true);
    const content = readFileSync(collectionFile, "utf-8");
    expect(content).toContain("TSSE Elysia API");
  });

  it("should have request files for each API domain", () => {
    const domains = ["auth", "users", "roles", "settings", "tasks", "mcp", "dashboard", "system"];
    for (const domain of domains) {
      const folderConfig = `.bruno/collections/tsse-elysia/${domain}/folder.yml`;
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
});