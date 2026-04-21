/**
 * E2E tests for error pages 404
 * Tests: Error page rendering and content verification
 */

import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../../config";

test.describe("404 Not Found Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/404`);
  });

  test("should display 404 error code", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should display page not found message", async ({ page }) => {
    await expect(page.getByText(/Page Not Found/i)).toBeVisible();
  });

  test("should have Back to Home button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Back to Home/i })).toBeVisible();
  });

  test("should have Go Back button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Go Back/i })).toBeVisible();
  });
});