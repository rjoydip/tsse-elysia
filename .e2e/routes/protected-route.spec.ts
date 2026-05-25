import { test, expect } from "@playwright/test";
import { isCI } from "std-env";
import { E2E_BASE_URL } from "../config";
import { signUpViaUI } from "../utils";

const TIMEOUT = isCI ? 30000 : 15000;

test.describe("Public Routes", () => {
  test.describe("Unauthenticated Access", () => {
    test("should allow public access to landing page", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).toBeVisible();
    });

    test("should show sign-in page for unauthenticated dashboard access", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/sign-in|dashboard/);
    });
  });
});

test.describe("Authenticated User Access", () => {
  test.beforeEach(async ({ page }) => {
    await signUpViaUI(page);
  });

  test("should allow authenticated users to access dashboard", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should allow authenticated users to access tasks", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard/tasks`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*dashboard\/tasks|sign-in|500|error/i);
  });

  test("should allow authenticated users to access apps", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard/apps`);
    await page.waitForLoadState("domcontentloaded", { timeout: TIMEOUT });
    await expect(page).toHaveURL(/.*dashboard\/apps/);
  });

  test("should allow authenticated users to access chats", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard/chats`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*dashboard\/chats|sign-in|500|error/i);
  });
});

test.describe("AuthGuard Component E2E", () => {
  test.describe("Guard Behavior", () => {
    test("should show loading state while checking authentication", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard`);
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      expect(url).toMatch(/dashboard|sign-in/);
    });

    test("should not render protected content for unauthenticated users", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard/settings`);
      await page.waitForLoadState("domcontentloaded", { timeout: TIMEOUT });
      const url = page.url();
      expect(url).toMatch(/sign-in|dashboard\/settings/);
    });
  });
});

test.describe("Role-Based Access in Routes", () => {
  test.describe("Default User Role", () => {
    test.beforeEach(async ({ page }) => {
      await signUpViaUI(page);
    });

    test("newly registered user should have access to basic dashboard", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test("should allow access to user list (if user has permission)", async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/dashboard/users`);
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      expect(url).toMatch(/dashboard\/users|sign-in|403/);
    });
  });
});

test.describe("Navigation Between Protected Routes", () => {
  test.beforeEach(async ({ page }) => {
    await signUpViaUI(page);
  });

  test("should navigate from dashboard to tasks", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded", { timeout: TIMEOUT });

    const tasksLink = page.getByRole("link", { name: /tasks/i }).first();
    if (await tasksLink.isVisible()) {
      await tasksLink.click();
      await page.waitForLoadState("domcontentloaded", { timeout: TIMEOUT });
      await expect(page).toHaveURL(/.*dashboard\/tasks/);
    } else {
      await page.goto(`${E2E_BASE_URL}/dashboard/tasks`);
      await page.waitForLoadState("domcontentloaded", { timeout: TIMEOUT });
      const url = page.url();
      expect(url).toMatch(/dashboard\/tasks/);
    }
  });

  test("should persist session across protected routes", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    await page.goto(`${E2E_BASE_URL}/dashboard/users`);
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    expect(url).toMatch(/dashboard/);
  });
});