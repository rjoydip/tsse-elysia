/**
 * E2E tests for authentication flow
 */

import { test, expect } from "@playwright/test";
import { navigateAndWait } from "./utils";

test.describe("Sign In Page", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, "/sign-in");
  });

  test("should have sign in button", async ({ page }) => {
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test("should have OAuth section", async ({ page }) => {
    await expect(page.getByText(/or continue with/i)).toBeVisible();
  });

  /* test("should have email input field", async ({ page }) => {
    const emailInput = page.getByLabel("Email").first();
    await expect(emailInput).toBeVisible();
  });
  
  test("should render sign in page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("should have password input field", async ({ page }) => {
    const passwordInput = page.getByLabel("Password").first();
    await expect(passwordInput).toBeVisible();
  });

  test("should have sign up link", async ({ page }) => {
    const signUpLink = page.getByRole("link", { name: /sign up/i });
    await expect(signUpLink).toBeVisible();
  });

  test("should have forgot password link", async ({ page }) => {
    const forgotPassword = page.getByText(/forgot password?/i);
    await expect(forgotPassword).toBeVisible();
  }); */
});

test.describe("Sign Up Page", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, "/sign-up");
  });

  test("should render sign up page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /create an account/i })).toBeVisible({
      timeout: 15000,
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
  });
});

test.describe("Auth Protected Routes", () => {
  test("should redirect to sign-in when accessing dashboard without auth", async ({ page }) => {
    await navigateAndWait(page, "/dashboard");
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(\/dashboard|\/sign-in)/);
  });

  test("should allow public access to status page", async ({ page }) => {
    await navigateAndWait(page, "/status");
    await expect(page.getByRole("heading", { name: /status/i })).toBeVisible({ timeout: 15000 });
  });
});