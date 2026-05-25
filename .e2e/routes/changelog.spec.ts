/**
 * E2E tests for the changelog page
 */

import { test, expect } from "@playwright/test";

test.describe("Changelog Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/changelog");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should render the changelog page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Changelog", exact: true })).toBeVisible();
  });

  test("should display subtitle", async ({ page }) => {
    await expect(page.getByText(/Stay up to date/)).toBeVisible();
  });

  test("should display latest version in banner", async ({ page }) => {
    await expect(page.getByText("1.2.0").first()).toBeVisible();
  });

  test("should show Latest badge in banner", async ({ page }) => {
    await expect(page.getByText("Latest").nth(1)).toBeVisible();
  });

  test("should display version entries", async ({ page }) => {
    await expect(page.getByText("1.2.0").first()).toBeVisible();
    await expect(page.getByText("1.1.0").first()).toBeVisible();
    await expect(page.getByText("1.0.0").first()).toBeVisible();
  });

  test("should display version titles", async ({ page }) => {
    await expect(page.getByText(/New Dashboard Components/).first()).toBeVisible();
  });

  test("should display release dates", async ({ page }) => {
    await expect(page.getByText("2026-03-28").first()).toBeVisible();
  });

  test("should display New badge for features", async ({ page }) => {
    await expect(page.getByText("New").first()).toBeVisible();
  });

  test("should display Fix badge", async ({ page }) => {
    await expect(page.getByText("Fix").first()).toBeVisible();
  });

  test("should display Improved badge", async ({ page }) => {
    await expect(page.getByText("Improved").first()).toBeVisible();
  });

  test("should have changelog entry expanded by default", async ({ page }) => {
    // ChangelogEntryComponent uses defaultValue={entry.version}, so 1.1.0 is open on load
    await expect(page.getByText("Added two-factor authentication (2FA) support")).toBeVisible();
  });
});

test.describe("Changelog Page Layout", () => {
  test("should render header on changelog page", async ({ page }) => {
    await page.goto("/changelog");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible();
  });

  test("should render footer on changelog page", async ({ page }) => {
    await page.goto("/changelog");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("footer").filter({ hasText: "TSS" }).first()).toBeVisible();
  });
});