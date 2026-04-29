/**
 * E2E tests for authenticated dashboard pages
 */

import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should show dashboard or redirect to sign-in", async ({ page }) => {
    const currentUrl = page.url();
    const isAuthenticated = currentUrl.includes("/dashboard");
    const isRedirectedToSignIn = currentUrl.includes("/sign-in");
    expect(isAuthenticated || isRedirectedToSignIn).toBe(true);
  });
});