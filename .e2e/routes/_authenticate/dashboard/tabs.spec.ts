import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config";
import { signUpViaUI } from "../../../utils";

test.describe("Dashboard Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await signUpViaUI(page);
  });

  test("should render dashboard tabs", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    // Check that all three tabs are present
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Analytics" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Reports" })).toBeVisible();
  });

  test("should have Reports tab disabled", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    // Check that Reports tab is disabled
    const reportsTab = page.getByRole("tab", { name: "Reports" });
    await expect(reportsTab).toBeDisabled();
  });

  test("should have Overview tab active by default", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    // Check that Overview tab is active
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  test("should switch tabs when clicked", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    // Click on Analytics tab
    const analyticsTab = page.getByRole("tab", { name: "Analytics" });
    await analyticsTab.click();

    // Check that Analytics tab is now active
    await expect(analyticsTab).toHaveAttribute("aria-selected", "true");

    // Check that Overview tab is no longer active
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    await expect(overviewTab).not.toHaveAttribute("aria-selected", "true");
  });

  test("should not activate Reports tab when clicked (negative test)", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    // Click on disabled Reports tab
    const reportsTab = page.getByRole("tab", { name: "Reports" });
    await reportsTab.click();

    // Verify Reports tab remains disabled after attempted click
    await expect(reportsTab).toBeDisabled();
    // Verify Reports tab did not become active
    await expect(reportsTab).not.toHaveAttribute("aria-selected", "true");

    // Verify Overview tab remains active (default)
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });
});