import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../config";
import { navigateAndWait } from "../utils";

test.describe("Branding Component", () => {
  test("should display dashboard image on login page (lg screen)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await navigateAndWait(page, `${E2E_BASE_URL}/sign-in`);
    await expect(page.locator("img[alt='TSSE']").first()).toBeVisible();
  });

  test("should display dashboard image on register page (lg screen)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await navigateAndWait(page, `${E2E_BASE_URL}/sign-up`);
    await expect(page.locator("img[alt='TSSE']").first()).toBeVisible();
  });

  test("should hide dashboard image on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateAndWait(page, `${E2E_BASE_URL}/sign-in`);
    await expect(page.locator("img[alt='TSSE']").first()).not.toBeVisible();
  });
});