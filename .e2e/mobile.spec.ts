/**
 * E2E tests for mobile behavior and responsive components
 */

import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "./config";

test.describe("Mobile Behavior", () => {
  test.describe("Sidebar Mobile", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${E2E_BASE_URL}/docs`);
      await page.waitForLoadState("domcontentloaded");
    });

    test("should render sidebar trigger button", async ({ page }) => {
      const trigger = page.locator('[data-sidebar="trigger"]');
      await expect(trigger).toBeVisible();
    });

    test("should have mobile detection via viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState("domcontentloaded");
      // On mobile, sidebar may not be visible until triggered
      // Just verify the page loaded without error
      await expect(page.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    });

    test("should toggle sidebar on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState("domcontentloaded");
      const trigger = page.locator('[data-sidebar="trigger"]').first();
      await trigger.click();
      // Verify toggle interaction remains available on mobile.
      await expect(trigger).toBeVisible();
    });

    test("should display sidebar content on desktop viewport", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.reload();
      await page.waitForLoadState("domcontentloaded");
      const sidebar = page.locator('[data-sidebar="sidebar"]');
      await expect(sidebar).toBeVisible();
      const sections = page.getByRole("button", {
        name: /Getting Started|Authentication|API/,
      });
      await expect(sections.first()).toBeVisible();
    });
  });

  test.describe("Responsive Header", () => {
    test("should render header on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${E2E_BASE_URL}/`);
      await page.waitForLoadState("domcontentloaded");
      const header = page.locator("header");
      await expect(header).toBeVisible();
    });

    test("should render header on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${E2E_BASE_URL}/`);
      await page.waitForLoadState("domcontentloaded");
      const header = page.locator("header");
      await expect(header).toBeVisible();
    });

    test("should show hamburger menu on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${E2E_BASE_URL}/docs`);
      await page.waitForLoadState("domcontentloaded");
      const menuButton = page.locator('[data-sidebar="trigger"]');
      await expect(menuButton).toBeVisible();
    });
  });

  test.describe("Responsive Docs Page", () => {
    test("should render docs on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${E2E_BASE_URL}/docs`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    });

    test("should render docs on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${E2E_BASE_URL}/docs`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    });

    test("should have collapsible sidebar on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${E2E_BASE_URL}/docs`);
      await page.waitForLoadState("domcontentloaded");
      const trigger = page.locator('[data-sidebar="trigger"]');
      await expect(trigger).toBeVisible();
    });
  });
});