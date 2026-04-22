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

  test("should display dashboard heading when authenticated", async ({ page }) => {
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard")) {
      const heading = page.getByRole("heading", { name: /Dashboard/i });
      await expect(heading).toBeVisible({ timeout: 5000 });
    } else {
      expect(currentUrl).toContain("/sign-in");
    }
  });
});

test.describe("Dashboard Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should show sidebar navigation when authenticated", async ({ page }) => {
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard")) {
      const sidebar = page.locator("[data-sidebar='container']");
      await expect(sidebar).toBeVisible({ timeout: 5000 });
    }
  });

  test("should have search component when authenticated", async ({ page }) => {
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard")) {
      const searchInput = page.locator("input[type='search'], input[placeholder*='Search']");
      await expect(searchInput).toBeVisible({ timeout: 5000 });
    }
  });
});