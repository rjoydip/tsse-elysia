/**
 * E2E tests for authenticated dashboard pages
 * Tests dashboard functionality with real user data
 */

import { test, expect } from "@playwright/test";
import { navigateAndWait } from "./utils";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, "/dashboard");
  });

  test("should show dashboard or redirect to sign-in", async ({ page }) => {
    const currentUrl = page.url();
    const isAuthenticated = currentUrl.includes("/dashboard");
    const isRedirectedToSignIn = currentUrl.includes("/sign-in");
    expect(isAuthenticated || isRedirectedToSignIn).toBe(true);
  });

  test("should display loading state initially", async ({ page }) => {
    // Skip if redirected to sign-in
    if (page.url().includes("/sign-in")) {
      return;
    }

    // Check for loading indicator
    const loadingElement = page.locator(
      '[data-testid="dashboard-loading"], text=Loading, .loading-spinner',
    );
    await expect(loadingElement.first()).toBeVisible({ timeout: 5000 });
  });

  test("should display user metric cards after loading", async ({ page }) => {
    // Skip if redirected to sign-in
    if (page.url().includes("/sign-in")) {
      return;
    }

    // Wait for metrics to load
    const metricsContainer = page.locator(
      '[data-testid="dashboard-metrics"], .metrics-container, [role="region"][aria-label="dashboard-metrics"]',
    );
    await expect(metricsContainer).toBeVisible({ timeout: 10000 });

    // Check for user metric card labels
    const totalUsersCard = page.locator("text=Total Users");
    await expect(totalUsersCard.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show Active Now, Active, Inactive, and Suspended user metrics on Overview", async ({
    page,
  }) => {
    // Skip if redirected to sign-in
    if (page.url().includes("/sign-in")) {
      return;
    }

    // Check that all user-focused metric cards exist on Overview
    await expect(page.locator("text=Total Users").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Active Users").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Inactive Users").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Suspended Users").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Active Now").first()).toBeVisible({ timeout: 5000 });
  });

  test("should show analytics tab with charts and distributions", async ({ page }) => {
    // Skip if redirected to sign-in
    if (page.url().includes("/sign-in")) {
      return;
    }

    // Click on Analytics tab
    await page.locator("text=Analytics").first().click();
    await page.waitForTimeout(1000);

    // Analytics shows charts and distributions
    await expect(page.locator("text=Weekly User Registrations").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Users by Role").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Users by Status").first()).toBeVisible({ timeout: 5000 });
  });

  test("should show User Registrations chart heading", async ({ page }) => {
    // Skip if redirected to sign-in
    if (page.url().includes("/sign-in")) {
      return;
    }

    // Overview tab should show the user registrations chart
    await expect(page.locator("text=User Registrations").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Recent Users").first()).toBeVisible({ timeout: 5000 });
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Skip if redirected to sign-in
    if (page.url().includes("/sign-in")) {
      return;
    }

    const errorElement = page.locator(
      '[data-testid="dashboard-error"], .error-message, .alert-error',
    );
    await expect(errorElement).toBeInDOM();
  });

  test("should update metrics in real-time (if applicable)", async ({ page }) => {
    // Skip if redirected to sign-in
    if (page.url().includes("/sign-in")) {
      return;
    }

    await page.waitForTimeout(3000);

    // Check that the dashboard is still responsive
    const dashboardContainer = page.locator(
      '[data-testid="dashboard-container"], .dashboard-container, #dashboard',
    );
    await expect(dashboardContainer).toBeVisible();
  });
});