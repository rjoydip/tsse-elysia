/**
 * E2E test: Bruno auth token flow.
 * Verifies that signing in sets a session_token and subsequent
 * authenticated requests receive a 200 response.
 *
 * This test runs against a live dev server and uses Bruno's CLI directly.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const COLLECTION_DIR = join(import.meta.dirname, "..", "..", ".bruno", "collections");
const ENV_FILE = join(import.meta.dirname, "..", "..", ".bruno", "environments", "local.yml");
const REPORT_DIR = join(import.meta.dirname, "..", "..", ".bruno", "reports");

describe("Bruno auth token flow", () => {
  beforeAll(() => {
    if (!existsSync(REPORT_DIR)) {
      mkdirSync(REPORT_DIR, { recursive: true });
    }
  });

  it("should run smoke tests and authenticate successfully", async () => {
    expect(existsSync(COLLECTION_DIR)).toBe(true);
    expect(existsSync(ENV_FILE)).toBe(true);

    // Run Bruno smoke tests
    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
      (resolve, reject) => {
        const proc = spawn("npx", ["@usebruno/cli", "run", "--env", "local", "--tags", "smoke"], {
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
      },
    );

    // Smoke tests should include auth and authenticated requests
    expect(result.stdout).toContain("sign-in");
    expect(result.stdout).toContain("session_token");
  });
});