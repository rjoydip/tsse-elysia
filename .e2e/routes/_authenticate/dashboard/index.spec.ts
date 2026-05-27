import { test, expect } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config";
import { signUpViaUI } from "../../../utils";

test.describe("Dashboard Index", () => {
  test.beforeEach(async ({ page }) => {
    await signUpViaUI(page);
  });

  test("should render dashboard when authenticated", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should load without crashing", async ({ page }) => {
    await page.goto(`${E2E_BASE_URL}/dashboard`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Dashboard Overview Chart API", () => {
  test.beforeEach(async ({ page }) => {
    await signUpViaUI(page);
  });

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  test("should return monthly registrations capped to current month", async ({ page }) => {
    const response = await page.request.get(
      `${E2E_BASE_URL}/api/dashboard/overview-chart/monthly-sales`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.monthlyData).toBeDefined();
    expect(body.timestamp).toBeDefined();

    const currentMonth = new Date().getMonth();
    expect(body.monthlyData).toHaveLength(currentMonth + 1);

    // Verify no months beyond the current month
    for (const item of body.monthlyData) {
      const monthIndex = monthNames.indexOf(item.name);
      expect(monthIndex).toBeGreaterThanOrEqual(0);
      expect(monthIndex).toBeLessThanOrEqual(currentMonth);
    }
  });

  test("should return yearly comparison capped to current month", async ({ page }) => {
    const response = await page.request.get(
      `${E2E_BASE_URL}/api/dashboard/overview-chart/yearly-comparison`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.yearlyData).toBeDefined();
    expect(body.timestamp).toBeDefined();

    const currentMonth = new Date().getMonth();
    expect(body.yearlyData).toHaveLength(currentMonth + 1);

    // Verify each item has the expected structure
    for (const item of body.yearlyData) {
      const monthIndex = monthNames.indexOf(item.name);
      expect(monthIndex).toBeGreaterThanOrEqual(0);
      expect(monthIndex).toBeLessThanOrEqual(currentMonth);
      expect(typeof item.currentYear).toBe("number");
      expect(typeof item.previousYear).toBe("number");
    }
  });

  test("should return 401 when not authenticated", async ({ request }) => {
    const response = await request.get(
      `${E2E_BASE_URL}/api/dashboard/overview-chart/monthly-sales`,
    );
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});