import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config";
import { signUpViaUI } from "../../../utils";

test.describe("Dashboard Index", () => {
  test.beforeEach(async ({ page }) => {
    await signUpViaUI(page);
  });

  test.describe("Dashboard Users", () => {
    test("should render users page when authenticated", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard/users`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/.*dashboard\/users/);
    });

    test("should load without crashing", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard/users`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).toBeVisible();
    });

    test("should support search params", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard/users?page=1&pageSize=10`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/.*dashboard\/users.*page=1/);
    });

    test("should have refresh button visible", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard/users`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      const refreshButton = page.getByRole("button", { name: /refresh/i });
      await expect(refreshButton).toBeVisible({ timeout: 10000 });
    });

    test("should display users heading", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard/users`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.getByRole("heading", { name: /users/i })).toBeVisible({ timeout: 10000 });
    });
  });
});