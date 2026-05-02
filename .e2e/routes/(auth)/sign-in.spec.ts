/**
 * E2E tests for Sign-In page
 * Tests page load, form fields, navigation, OAuth, and mobile responsive behavior
 */

import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../../config";
import { navigateAndWait } from "../../utils";

test.describe("Sign-In Page", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, `${E2E_BASE_URL}/sign-in`);
  });

  test.describe("Page Load", () => {
    test("should load sign-in page without crashing", async ({ page }) => {
      await expect(page.locator("h2").filter({ hasText: "Sign in" })).toBeVisible();
    });

    test("should display sign in heading", async ({ page }) => {
      await expect(page.locator("h2").filter({ hasText: "Sign in" })).toBeVisible();
    });

    test("should have email input with correct label", async ({ page }) => {
      await expect(page.getByLabel("Email")).toBeVisible();
    });

    test("should have password input", async ({ page }) => {
      await expect(page.getByLabel("Password").first()).toBeVisible();
    });

    test("should have sign in button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("should have forgot password link", async ({ page }) => {
      await expect(page.getByText(/forgot password?/i)).toBeVisible();
    });

    test("should have sign up link for new users", async ({ page }) => {
      await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
    });

    test("should have OAuth section with divider", async ({ page }) => {
      await expect(page.getByText(/or continue with/i)).toBeVisible();
    });

    test("should have GitHub and Google OAuth buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    });
  });

  test.describe("Form Submission - Empty Fields", () => {
    test("should attempt submission with empty email", async ({ page }) => {
      await page.getByLabel("Email").fill("");
      await page.getByLabel("Password").fill("password123");
      await page.getByRole("button", { name: /sign in/i }).click();
      // Application handles submission - verify page doesn't crash
      await page.waitForLoadState("domcontentloaded");
    });

    test("should attempt submission with empty password", async ({ page }) => {
      await page.getByLabel("Email").fill("test@example.com");
      await page.getByLabel("Password").fill("");
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForLoadState("domcontentloaded");
    });
  });

  test.describe("Navigation", () => {
    test("should have sign up link visible", async ({ page }) => {
      const signUpLink = page.getByRole("link", { name: /sign up/i });
      await expect(signUpLink).toBeVisible();
    });

    test("should have forgot password text link visible", async ({ page }) => {
      const forgotLink = page.getByText(/forgot password?/i);
      await expect(forgotLink).toBeVisible();
    });
  });

  test.describe("OAuth Buttons", () => {
    test("should have clickable GitHub button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /github/i })).toBeEnabled();
    });

    test("should have clickable Google button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /google/i })).toBeEnabled();
    });
  });

  test.describe("Redirect Query Param", () => {
    test("should preserve redirect param in URL", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/sign-in?redirect=/dashboard/settings`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/redirect=.*dashboard/);
    });
  });

  test.describe("Mobile Responsive", () => {
    test("should display sign in form on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${E2E_BASE_URL}/sign-in`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password").first()).toBeVisible();
    });
  });
});