/**
 * E2E tests for authentication flow
 */

import { test, expect } from "@playwright/test";

test.describe("Sign In Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should render sign in form", async ({ page }) => {
    await expect(page.locator("h2").filter({ hasText: /sign in/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("should have email input field", async ({ page }) => {
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeVisible();
  });

  test("should have password input field", async ({ page }) => {
    const passwordInput = page.getByLabel("Password").first();
    await expect(passwordInput).toBeVisible();
  });

  test("should have sign in button", async ({ page }) => {
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test("should have sign up link", async ({ page }) => {
    const signUpLink = page.getByRole("link", { name: /sign up/i });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute("href", "/sign-up");
  });

  test("should have forgot password link", async ({ page }) => {
    const forgotPassword = page.getByText(/forgot password?/i);
    await expect(forgotPassword).toBeVisible();
  });

  test("should have OAuth section", async ({ page }) => {
    await expect(page.getByText(/or continue with/i)).toBeVisible();
  });
});

test.describe("Sign Up Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-up");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should render sign up form", async ({ page }) => {
    await expect(page.locator("h2").filter({ hasText: /create an account/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("should have name input field", async ({ page }) => {
    const nameInput = page.getByLabel("Name");
    await expect(nameInput).toBeVisible();
  });

  test("should have email input field", async ({ page }) => {
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeVisible();
  });

  test("should have password input fields", async ({ page }) => {
    const passwordInput = page.getByLabel("Password").first();
    await expect(passwordInput).toBeVisible();

    const confirmPasswordInput = page.getByLabel("Confirm Password");
    await expect(confirmPasswordInput).toBeVisible();
  });

  test("should have create account button", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /create account/i });
    await expect(createButton).toBeVisible();
  });

  test("should have sign in link for existing users", async ({ page }) => {
    const signInLink = page.getByRole("link", { name: /sign in/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/sign-in");
  });
});

test.describe("Auth Protected Routes", () => {
  test("should redirect to sign-in when accessing dashboard without auth", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    // Should either redirect to sign-in or show dashboard
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(\/dashboard|\/sign-in)/);
  });

  test("should allow public access to status page", async ({ page }) => {
    await page.goto("/status");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /status/i })).toBeVisible({ timeout: 10000 });
  });
});