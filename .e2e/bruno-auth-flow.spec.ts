/**
 * E2E test: Bruno auth token flow.
 * Verifies that signing in sets a session_token and subsequent
 * authenticated requests receive a 200 response.
 *
 * This test runs against a live dev server and uses Bruno's CLI directly.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const COLLECTION_DIR = join(import.meta.dirname, "..", "..", ".bruno", "collections");
const ENV_FILE = join(import.meta.dirname, "..", "..", ".bruno", "environments", "local.yml");
const REPORT_DIR = join(import.meta.dirname, "..", "..", ".bruno", "reports");

/**
 * Runs a Bruno CLI command and returns the result.
 */
function runBruno(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["@usebruno/cli", ...args], {
      cwd: COLLECTION_DIR,
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? -1 });
    });

    proc.on("error", reject);
  });
}

describe("Bruno auth token flow", () => {
  beforeAll(() => {
    if (!existsSync(REPORT_DIR)) {
      mkdirSync(REPORT_DIR, { recursive: true });
    }
  });

  it("should run smoke tests and authenticate successfully", async () => {
    expect(existsSync(COLLECTION_DIR)).toBe(true);
    expect(existsSync(ENV_FILE)).toBe(true);

    // Step 1: Run sign-in first to establish a session
    const signInResult = await runBruno([
      "run",
      "--env-file",
      join(import.meta.dirname, "..", "..", ".bruno", "environments", "local.yml"),
      "--tags",
      "auth",
    ]);
    expect(signInResult.stdout).toContain("sign-in");
    // Sign-in should pass (exit 0) and set session_token
    expect(signInResult.exitCode).toBe(0);

    // Step 2: Run authenticated smoke requests (they reuse session_token)
    const authedResult = await runBruno([
      "run",
      "--env-file",
      join(import.meta.dirname, "..", "..", ".bruno", "environments", "local.yml"),
      "--tags",
      "smoke",
      "--sequential",
    ]);
    expect(authedResult.stdout).toContain("sign-in");
    expect(authedResult.stdout).toContain("session_token");
    // Verify at least one authenticated request returned 200
    expect(authedResult.stdout).toContain("200");
    // Verify the run completed successfully
    expect(authedResult.exitCode).toBe(0);
  });
});