/**
 * Integration tests for CLI scripts
 * Tests: full execution of scripts via bun
 */

import { describe, expect, it, afterEach, beforeEach } from "bun:test";
import { existsSync, unlinkSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

const TEST_DIR = "test-results";
const DECISIONS_FILE = join(TEST_DIR, "DECISIONS.md");

describe("CLI Integration", () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR);
    }
    writeFileSync(DECISIONS_FILE, "# Decision Log\n\n## Decision Log\n");
  });

  afterEach(() => {
    try {
      if (existsSync(DECISIONS_FILE)) unlinkSync(DECISIONS_FILE);
      // rmdirSync(TEST_DIR); // Might fail if not empty, let's keep it simple
    } catch {}
  });

  it("should successfully run new-decision logic via bun", () => {
    const scriptContent = readFileSync("scripts/new-decision.ts", "utf-8");
    const tempScript = join(TEST_DIR, "temp-new-decision.ts");
    const modifiedContent = scriptContent.replace(
      'const FILE = "knowledge/DECISIONS.md";',
      `const FILE = "${DECISIONS_FILE.replace(/\\/g, "/")}";`,
    );
    writeFileSync(tempScript, modifiedContent);

    const uniqueTitle = `Unique Decision ${Date.now()}`;
    const result = spawnSync("bun", ["run", tempScript, uniqueTitle], {
      encoding: "utf-8",
    });

    if (result.status !== 0) {
      console.error(result.stderr);
    }
    expect(result.status).toBe(0);
    const updatedContent = readFileSync(DECISIONS_FILE, "utf-8");
    expect(updatedContent).toContain(`### 001: ${uniqueTitle}`);

    unlinkSync(tempScript);
  });

  it("should fail when duplicate title is provided", () => {
    const scriptContent = readFileSync("scripts/new-decision.ts", "utf-8");
    const tempScript = join(TEST_DIR, "temp-dup.ts");
    const modifiedContent = scriptContent.replace(
      'const FILE = "knowledge/DECISIONS.md";',
      `const FILE = "${DECISIONS_FILE.replace(/\\/g, "/")}";`,
    );
    writeFileSync(tempScript, modifiedContent);

    const title = "Duplicate Decision";
    // First run
    spawnSync("bun", ["run", tempScript, title]);

    // Second run with same title
    const result = spawnSync("bun", ["run", tempScript, title], {
      encoding: "utf-8",
    });

    // The warning messages go to stdout, not stderr
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Decision with similar title already exists");

    unlinkSync(tempScript);
  });
});