/**
 * Unit tests for preferences store - integration tests
 * Tests the API and usage patterns
 */

import { describe, expect, it } from "bun:test";
import { setPreferences, resetPreferences } from "~/lib/stores/dashboard/preferences";

describe("Preferences Store API", () => {
  describe("Exports", () => {
    it("should export setPreferences function", () => {
      expect(typeof setPreferences).toBe("function");
    });

    it("should export resetPreferences function", () => {
      expect(typeof resetPreferences).toBe("function");
    });
  });

  describe("setPreferences", () => {
    it("should be callable with partial preferences", () => {
      expect(() => setPreferences({ emailNotifications: false })).not.toThrow();
    });

    it("should be callable with multiple preferences", () => {
      expect(() =>
        setPreferences({
          emailNotifications: false,
          marketingEmails: true,
          sessionAlerts: false,
        }),
      ).not.toThrow();
    });
  });

  describe("resetPreferences", () => {
    it("should be callable without arguments", () => {
      expect(() => resetPreferences()).not.toThrow();
    });
  });
});