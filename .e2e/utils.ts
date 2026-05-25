/**
 * Common E2E utility functions for authentication
 */

import { isCI } from "std-env";
import type { Page } from "@playwright/test";
import { E2E_BASE_URL } from "./config";

const TEST_PASSWORD = "TestPassword123!";

/**
 * Generates a unique email for E2E tests
 */
export function generateTestEmail(pageName: string): string {
  return `e2e-${pageName}-${Date.now()}@test.com`;
}

/**
 * Waits for the DOM to be ready (HTML parsed, DOM tree built).
 * Uses `domcontentloaded` because TanStack Start SSR uses HTML streaming
 * (chunked transfer encoding). Both `networkidle` and `load` can timeout
 * since the streaming connection may stay open indefinitely.
 *
 * Playwright's auto-waiting on locator actions (`fill`, `click`,
 * `toBeVisible`, etc.) handles React hydration automatically.
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 * @param options.timeout - Max wait time in ms (default: 15000ms for CI, 5000ms for local)
 */
export async function waitForPageReady(
  page: Page,
  options?: {
    timeout?: number;
  },
): Promise<void> {
  const timeout = options?.timeout ?? (isCI ? 15000 : 5000);

  // Use domcontentloaded instead of load or networkidle.
  // TanStack Start streaming SSR uses chunked transfer encoding
  // which prevents both `load` and `networkidle` from resolving.
  await page.waitForLoadState("domcontentloaded", { timeout });
}

/**
 * Navigate to a URL and wait for page DOM to be ready.
 * Uses `domcontentloaded` to avoid hangs with streaming SSR.
 *
 * @deprecated Options `waitForIdle` and `waitForDomStable` are deprecated.
 *             Only `timeout` is used now.
 */
export async function navigateAndWait(
  page: Page,
  url: string,
  options?: {
    timeout?: number;
    /** @deprecated No-op — always uses `domcontentloaded` */
    waitForIdle?: boolean;
    /** @deprecated No-op — uses `domcontentloaded` instead */
    waitForDomStable?: boolean;
  },
): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForPageReady(page, { timeout: options?.timeout });
}

/**
 * Authenticates a user via UI sign-up form
 * navigates to sign-up page, fills form, submits, and waits for dashboard
 */
export async function signUpViaUI(
  page: Page,
  email?: string,
  name = "E2E Test User",
): Promise<boolean> {
  const testEmail = email ?? generateTestEmail("auth");

  await navigateAndWait(page, `${E2E_BASE_URL}/sign-up`);

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(testEmail);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Confirm Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Logs in a user via UI sign-in form
 */
export async function signInViaUI(
  page: Page,
  email: string,
  password = TEST_PASSWORD,
): Promise<boolean> {
  await navigateAndWait(page, `${E2E_BASE_URL}/sign-in`);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}