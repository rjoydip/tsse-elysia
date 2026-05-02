/**
 * E2E tests for Authenticated Help Center page
 * Tests route existence and auth redirect behavior
 */

import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../../config";
import { navigateAndWait } from "../../utils";

test.describe("Authenticated Help Center Page", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, `${E2E_BASE_URL}/help-center`);
  });

  test("should redirect to sign-in when not authenticated", async ({ page }) => {
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("should have sign-in page accessible", async ({ page }) => {
    await navigateAndWait(page, `${E2E_BASE_URL}/sign-in`);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("should have help-center route defined", async ({ page }) => {
    const response = await page.request.get(`${E2E_BASE_URL}/help-center`);
    expect([200, 302]).toContain(response.status());
  });
});