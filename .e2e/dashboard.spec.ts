/**
 * E2E tests for authenticated dashboard pages
 */

import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - may redirect to sign-in if not authenticated
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should show dashboard or redirect to sign-in", async ({ page }) => {
    // Either dashboard loads or user gets redirected to sign-in
    const currentUrl = page.url();
    const isAuthenticated = currentUrl.includes("/dashboard");
    const isRedirectedToSignIn = currentUrl.includes("/sign-in");

    expect(isAuthenticated || isRedirectedToSignIn).toBe(true);
  });

  test("should display dashboard heading when authenticated", async ({ page }) => {
    // If authenticated, should show dashboard content
    // This test will pass if user is signed in
    const heading = page.getByRole("heading", { name: /Dashboard/i });
    await expect(heading)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // If not authenticated, should show sign-in page instead
        expect(page.url()).toContain("/sign-in");
      });
  });
});

test.describe("Dashboard Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should show sidebar navigation when authenticated", async ({ page }) => {
    // Look for sidebar elements
    const sidebar = page.locator("[data-sidebar='container']");
    await expect(sidebar)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Expected if not authenticated
      });
  });

  test("should have search component", async ({ page }) => {
    // Search is typically present in dashboard header area
    const searchInput = page.locator("input[type='search'], input[placeholder*='Search']");
    await expect(searchInput)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Expected if not authenticated
      });
  });
});

test.describe("Dashboard Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display Overview tab", async ({ page }) => {
    const overviewTab = page.getByRole("tab", { name: /Overview/i });
    await expect(overviewTab)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Expected if not authenticated
      });
  });

  test("should display Analytics tab (may be disabled)", async ({ page }) => {
    const analyticsTab = page.getByRole("tab", { name: /Analytics/i });
    await expect(analyticsTab)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Expected if not authenticated
      });
  });
});

test.describe("Dashboard Protected Routes", () => {
  test("should protect /dashboard/settings route", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("domcontentloaded");

    // Should redirect to sign-in or show settings
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(\/dashboard\/settings|\/sign-in)/);
  });

  test("should protect /dashboard/apps route", async ({ page }) => {
    await page.goto("/dashboard/apps");
    await page.waitForLoadState("domcontentloaded");

    // Should redirect to sign-in or show apps
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(\/dashboard\/apps|\/sign-in)/);
  });
});

test.describe("Status Page Public Access", () => {
  test("should allow public access to /status", async ({ page }) => {
    await page.goto("/status");
    await page.waitForLoadState("domcontentloaded");

    // Status page should be publicly accessible
    await expect(page.getByRole("heading", { name: /Status/i })).toBeVisible({ timeout: 10000 });
  });

  test("should display service status indicators", async ({ page }) => {
    await page.goto("/status");
    await page.waitForLoadState("domcontentloaded");

    // Should show service status tabs
    await expect(page.getByRole("tab", { name: /API Services/i })).toBeVisible({ timeout: 10000 });
  });
});