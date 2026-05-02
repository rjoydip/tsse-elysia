/**
 * E2E tests for the blog page
 */

import { test, expect } from "@playwright/test";
import { navigateAndWait } from "../utils";

test.describe("Blog Page", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, "/blog", { waitForIdle: true });
  });

  test("should render the blog page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Blog", exact: true })).toBeVisible();
  });

  test("should display subtitle", async ({ page }) => {
    await expect(page.getByText(/Latest updates/)).toBeVisible();
  });

  test("should display featured post", async ({ page }) => {
    await expect(page.getByText("Featured")).toBeVisible();
  });

  test("should display featured post title", async ({ page }) => {
    await expect(page.getByText("Introducing TSS Elysia")).toBeVisible();
  });

  test("should display Recent Posts section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Recent Posts" })).toBeVisible();
  });

  test("should display tags on post cards", async ({ page }) => {
    await expect(page.getByText("Tutorial").first()).toBeVisible();
  });

  test("should display author information on featured post", async ({ page }) => {
    await expect(page.getByText("Team TSS")).toBeVisible();
  });

  test("should display read time on posts", async ({ page }) => {
    await expect(page.getByText(/min read/).first()).toBeVisible();
  });

  test("should display post dates", async ({ page }) => {
    await expect(page.getByText("2026-03-15")).toBeVisible();
  });
});

test.describe("Blog Page Layout", () => {
  test("should render header on blog page", async ({ page }) => {
    await navigateAndWait(page, "/blog", { waitForIdle: true });
    await expect(page.locator("header").first()).toBeVisible();
  });

  test("should render footer on blog page", async ({ page }) => {
    await navigateAndWait(page, "/blog", { waitForIdle: true });
    await expect(page.locator("footer.py-4").filter({ hasText: "TSS" }).first()).toBeVisible();
  });

  test("should have header nav links", async ({ page }) => {
    await navigateAndWait(page, "/blog", { waitForIdle: true });
    await expect(page.locator("header nav a[href*='docs']").first()).toBeVisible({
      timeout: 10000,
    });
  });
});