import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../config";

test.describe("Branding Component", () => {
  test("should display dashboard image on login page (lg screen)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${E2E_BASE_URL}/sign-in`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("img[alt='TSSE']").first()).toBeVisible();
  });

  test("should display dashboard image on register page (lg screen)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${E2E_BASE_URL}/sign-up`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("img[alt='TSSE']").first()).toBeVisible();
  });

  test("should hide dashboard image on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${E2E_BASE_URL}/sign-in`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("img[alt='TSSE']").first()).not.toBeVisible();
  });
});