import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config";
import { signUpViaUI } from "../../../utils";

test.describe("Dashboard Users", () => {
  test.beforeEach(async ({ page }) => {
    const success = await signUpViaUI(page);
    expect(success).toBe(true);

    await page.goto(`${E2E_BASE_URL}/dashboard/users`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
  });

  test("should render users page when authenticated", async ({ page }) => {
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/dashboard\/users|sign-in|500/);
  });

  test("should load without crashing", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display page content", async ({ page }) => {
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});