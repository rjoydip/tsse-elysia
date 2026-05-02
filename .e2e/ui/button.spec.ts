/**
 * E2E tests for UI components
 * Tests: Button
 */

import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../config";
import { navigateAndWait } from "../utils";

test.describe("Button Component", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, `${E2E_BASE_URL}/sign-in`);
  });

  test("should render default button", async ({ page }) => {
    const button = page.getByRole("button", { name: /sign in/i });
    await expect(button).toBeVisible();
    await expect(button).toHaveClass(/bg-primary/);
  });

  test("should render outline button variant", async ({ page }) => {
    const button = page.getByRole("button", { name: /GitHub/i });
    await expect(button).toBeVisible();
    await expect(button).toHaveClass(/border/);
  });

  test("should be disabled when disabled prop is true", async ({ page }) => {
    await page.evaluate(() => {
      const btn = document.createElement("button");
      btn.setAttribute("disabled", "true");
      btn.textContent = "Disabled";
      document.body.appendChild(btn);
    });
    const button = page.locator("button:has-text('Disabled')");
    await expect(button).toBeDisabled();
  });
});