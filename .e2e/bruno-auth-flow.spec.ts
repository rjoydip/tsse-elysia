/**
 * E2E test: Bruno auth token flow.
 * Verifies that signing in sets a session_token and subsequent
 * authenticated requests receive a 200 response.
 *
 * This test runs against a live dev server and uses Bruno's CLI directly.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const COLLECTION_DIR = join(import.meta.dirname, "..", "..", ".bruno", "collections");
const ENV_FILE = join(import.meta.dirname, "..", "..", ".bruno", "environments", "local.yml");
const REPORT_DIR = join(import.meta.dirname, "..", "..", ".bruno", "reports");
const REPORT_JSON = join(REPORT_DIR, "e2e-report.json");

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

  it("should authenticate and return 200 for all smoke-tagged requests", async () => {
    expect(existsSync(COLLECTION_DIR)).toBe(true);
    expect(existsSync(ENV_FILE)).toBe(true);

    // Run all smoke-tagged requests in a single session (seq: 0 sign-in runs first)
    const result = await runBruno([
      "run",
      "--env-file",
      ENV_FILE,
      "--tags",
      "smoke",
      "--reporter-json",
      REPORT_JSON,
    ]);
    expect(result.exitCode).toBe(0);

    // Parse the JSON reporter for per-request validation
    expect(existsSync(REPORT_JSON)).toBe(true);
    const report = JSON.parse(readFileSync(REPORT_JSON, "utf-8"));

    // Each request in the report should have status 200
    const requests = report?.requests || report?.results || [];
    expect(requests.length).toBeGreaterThan(0);

    for (const req of requests) {
      expect(req.status).toBe(200);
    }
  });
});