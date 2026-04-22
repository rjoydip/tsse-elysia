/**
 * E2E tests for Sign-Up page
 * Tests page load, form fields, navigation, OAuth, and mobile responsive behavior
 */

import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../../config";

test.describe("Sign-Up Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/sign-up`);
    await page.waitForLoadState("domcontentloaded");
  });

  test.describe("Page Load", () => {
    test("should load sign-up page without crashing", async ({ page }) => {
      await expect(page.locator("h2").filter({ hasText: "Create an account" })).toBeVisible();
    });

    test("should display create account heading", async ({ page }) => {
      await expect(page.locator("h2").filter({ hasText: "Create an account" })).toBeVisible();
    });

    test("should have name input", async ({ page }) => {
      await expect(page.getByLabel("Name")).toBeVisible();
    });

    test("should have email input", async ({ page }) => {
      await expect(page.getByLabel("Email")).toBeVisible();
    });

    test("should have password input", async ({ page }) => {
      await expect(page.getByLabel("Password").first()).toBeVisible();
    });

    test("should have confirm password input", async ({ page }) => {
      await expect(page.getByLabel("Confirm Password")).toBeVisible();
    });

    test("should have create account button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
    });

    test("should have sign in link for existing users", async ({ page }) => {
      await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    });

    test("should have OAuth section", async ({ page }) => {
      await expect(page.getByText(/or continue with/i)).toBeVisible();
    });
  });

  test.describe("Form Submission - Empty Fields", () => {
    test("should attempt submission with empty name", async ({ page }) => {
      await page.getByLabel("Name").fill("");
      await page.getByLabel("Email").fill("test@example.com");
      await page.getByLabel("Password").first().fill("Password123");
      await page.getByLabel("Confirm Password").fill("Password123");
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForLoadState("domcontentloaded");
    });

    test("should attempt submission with empty password", async ({ page }) => {
      await page.getByLabel("Name").fill("John Doe");
      await page.getByLabel("Email").fill("test@example.com");
      await page.getByLabel("Password").first().fill("");
      await page.getByLabel("Confirm Password").fill("");
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForLoadState("domcontentloaded");
    });
  });

  test.describe("Navigation", () => {
    test("should have sign in link visible", async ({ page }) => {
      await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
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

  test.describe("Mobile Responsive", () => {
    test("should display sign up form on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${E2E_BASE_URL}/sign-up`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByLabel("Name")).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
    });
  });
});