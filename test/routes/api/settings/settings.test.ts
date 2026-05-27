/**
 * Unit tests for Settings API routes.
 * Tests profile, account, display, and notifications endpoints.
 */

import { describe, it, expect } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";

const baseUrl = "http://localhost";

describe("Settings API", () => {
  describe("Unauthenticated Access", () => {
    describe("GET /api/settings/profile", () => {
      it("should return 401 when not authenticated", async () => {
        const response = await apiRoutes.handle(new Request(`${baseUrl}/api/settings/profile`));

        expect(response.status).toBe(401);
      });
    });

    describe("PUT /api/settings/profile", () => {
      it("should return 401 when not authenticated", async () => {
        const response = await apiRoutes.handle(
          new Request(`${baseUrl}/api/settings/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "testuser",
              bio: "Test bio",
              urls: [],
            }),
          }),
        );

        expect(response.status).toBe(401);
      });
    });

    describe("GET /api/settings/account", () => {
      it("should return 401 when not authenticated", async () => {
        const response = await apiRoutes.handle(new Request(`${baseUrl}/api/settings/account`));

        expect(response.status).toBe(401);
      });
    });

    describe("PUT /api/settings/account", () => {
      it("should return 401 when not authenticated", async () => {
        const response = await apiRoutes.handle(
          new Request(`${baseUrl}/api/settings/account`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Test User",
              language: "en",
            }),
          }),
        );

        expect(response.status).toBe(401);
      });
    });

    describe("GET /api/settings/display", () => {
      it("should return 401 when not authenticated", async () => {
        const response = await apiRoutes.handle(new Request(`${baseUrl}/api/settings/display`));

        expect(response.status).toBe(401);
      });
    });

    describe("PUT /api/settings/display", () => {
      it("should return 401 when not authenticated", async () => {
        const response = await apiRoutes.handle(
          new Request(`${baseUrl}/api/settings/display`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: ["recents", "home"],
            }),
          }),
        );

        expect(response.status).toBe(401);
      });
    });

    describe("GET /api/settings/notifications", () => {
      it("should return 401 when not authenticated", async () => {
        const response = await apiRoutes.handle(
          new Request(`${baseUrl}/api/settings/notifications`),
        );

        expect(response.status).toBe(401);
      });
    });

    describe("PUT /api/settings/notifications", () => {
      it("should return 401 when not authenticated", async () => {
        const response = await apiRoutes.handle(
          new Request(`${baseUrl}/api/settings/notifications`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "all",
              mobile: true,
              communication_emails: true,
              social_emails: true,
              marketing_emails: false,
              security_emails: true,
            }),
          }),
        );

        expect(response.status).toBe(401);
      });
    });
  });

  describe("Request Validation", () => {
    it("should reject malformed profile data", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/settings/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bio: "Missing username",
          }),
        }),
      );

      expect(response.status).toBe(500);
    });

    it("should reject missing notification type", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/settings/notifications`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile: true,
            communication_emails: true,
            social_emails: true,
            marketing_emails: false,
            security_emails: true,
          }),
        }),
      );

      expect(response.status).toBe(500);
    });

    it("should reject display with non-array items", async () => {
      const response = await apiRoutes.handle(
        new Request(`${baseUrl}/api/settings/display`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: "not-an-array",
          }),
        }),
      );

      expect(response.status).toBe(500);
    });
  });

  describe("Response Format", () => {
    it("should return JSON content type for profile", async () => {
      const response = await apiRoutes.handle(new Request(`${baseUrl}/api/settings/profile`));

      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should return JSON content type for account", async () => {
      const response = await apiRoutes.handle(new Request(`${baseUrl}/api/settings/account`));

      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should return JSON content type for display", async () => {
      const response = await apiRoutes.handle(new Request(`${baseUrl}/api/settings/display`));

      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should return JSON content type for notifications", async () => {
      const response = await apiRoutes.handle(new Request(`${baseUrl}/api/settings/notifications`));

      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });
});