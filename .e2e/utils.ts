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
 * Waits for page to be fully ready (network idle + hydration)
 * Works in both CI and local environments
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 * @param options.timeout - Max wait time in ms (default: 15000ms for CI, 5000ms for local)
 * @param options.waitForIdle - Wait for network idle (default: true)
 * @param options.waitForDomStable - Wait for DOM to stabilize (default: true)
 */
export async function waitForPageReady(
  page: Page,
  options?: {
    timeout?: number;
    waitForIdle?: boolean;
    waitForDomStable?: boolean;
  },
): Promise<void> {
  const timeout = options?.timeout ?? (isCI ? 15000 : 5000);
  const waitForIdle = options?.waitForIdle ?? true;
  const waitForDomStable = options?.waitForDomStable ?? true;

  if (waitForIdle) {
    try {
      await page.waitForLoadState("networkidle", { timeout });
    } catch {
      await page.waitForLoadState("domcontentloaded");
    }
  } else {
    await page.waitForLoadState("domcontentloaded");
  }

  if (waitForDomStable) {
    try {
      await page.waitForFunction(
        () => {
          return document.readyState === "complete";
        },
        { timeout },
      );
    } catch {
      // Fallback: small delay to allow hydration
      await page.waitForTimeout(isCI ? 1000 : 500);
    }
  }
}

/**
 * Navigate to a URL and wait for page to be fully ready
 */
export async function navigateAndWait(
  page: Page,
  url: string,
  options?: {
    timeout?: number;
    waitForIdle?: boolean;
    waitForDomStable?: boolean;
  },
): Promise<void> {
  await page.goto(url);
  await waitForPageReady(page, options);
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

  await page.goto(`${E2E_BASE_URL}/sign-up`);
  await page.waitForLoadState("domcontentloaded");

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
  await page.goto(`${E2E_BASE_URL}/sign-in`);
  await page.waitForLoadState("domcontentloaded");

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