/**
 * Playwright End-to-End Testing Configuration
 *
 * Provides centralized settings for Playwright tests, including test directory,
 * parallelization, retries, and browser selection.
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from "@playwright/test";
import { isCI } from "std-env";
import { E2E_BASE_URL, E2E_HOST, E2E_PORT } from "./.e2e/config";

export default defineConfig({
  testDir: "./.e2e",
  fullyParallel: isCI,
  forbidOnly: !!isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  globalSetup: "./.e2e/_setup.ts",
  globalTeardown: "./.e2e/_teardown.ts",
  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry",
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    // Pass test env to the server via process.env
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          timeout: 120 * 1000,
          args: [
            "--disable-dev-shm-usage",
            // On Windows, avoid the GPU context crash (`Failed to create shared context
            // for virtualization`) that occurs in headless mode with `--disable-gpu`
            // and `--disable-software-rasterizer`. Running headed uses the native GPU
            // driver instead. See: https://playwright.dev/docs/troubleshooting#on-windows
            ...(process.platform === "win32" ? [] : ["--disable-gpu"]),
          ],
        },
      },
    },
  ],
  webServer: isCI
    ? undefined
    : {
        command:
          process.platform === "win32"
            ? `set NODE_ENV=test && bun run preview --host=${E2E_HOST} --port=${E2E_PORT}`
            : `NODE_ENV=test bun run preview --host=${E2E_HOST} --port=${E2E_PORT}`,
        url: E2E_BASE_URL,
        reuseExistingServer: !isCI,
        timeout: 120 * 1000,
      },
});