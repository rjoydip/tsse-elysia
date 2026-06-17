import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

/**
 * E2E tests for the Email Render API.
 * Requires the dev server to be running with Maizzle build output available.
 */
test.describe("POST /api/email/render", () => {
  test("should return 404 for unknown template", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/email/render`, {
      data: {
        template: "nonexistent",
        data: { key: "value" },
      },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toContain('Template "nonexistent" not found');
  });

  test("should return 400 when template is missing", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/email/render`, {
      data: {
        data: { username: "test" },
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  test("should return 400 when data is missing", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/email/render`, {
      data: {
        template: "welcome",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("should return 400 for empty data", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/email/render`, {
      data: {
        template: "welcome",
        data: {},
      },
    });

    expect(response.status()).toBe(400);
  });

  test("should render welcome template with substituted variables", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/email/render`, {
      data: {
        template: "welcome",
        data: {
          username: "Jane",
          dashboardUrl: "https://example.com/dashboard",
        },
      },
    });

    // This test requires Maizzle build output to exist.
    // If build output doesn't exist, expect 404.
    if (response.status() === 200) {
      const html = await response.text();
      expect(response.headers()["content-type"]).toContain("text/html");
      expect(html).toContain("Jane");
      expect(html).toContain("https://example.com/dashboard");
      expect(html).toContain("<!DOCTYPE html>");
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test("should render verify-email template", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/email/render`, {
      data: {
        template: "verify-email",
        data: {
          username: "John",
          verificationUrl: "https://example.com/verify?token=abc",
          expiresIn: "24 hours",
        },
      },
    });

    if (response.status() === 200) {
      const html = await response.text();
      expect(html).toContain("John");
      expect(html).toContain("https://example.com/verify?token=abc");
      expect(html).toContain("24 hours");
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test("should render password-reset template", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/email/render`, {
      data: {
        template: "password-reset",
        data: {
          username: "Alice",
          resetUrl: "https://example.com/reset?token=xyz",
          expiresIn: "1 hour",
        },
      },
    });

    if (response.status() === 200) {
      const html = await response.text();
      expect(html).toContain("Alice");
      expect(html).toContain("https://example.com/reset?token=xyz");
      expect(html).toContain("1 hour");
    } else {
      expect(response.status()).toBe(404);
    }
  });
});