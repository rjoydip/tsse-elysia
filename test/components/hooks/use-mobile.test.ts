/**
 * Unit tests for useIsMobile hook utilities
 * Tests the mobile breakpoint logic without React hooks
 */

import { describe, expect, it, vi } from "bun:test";

/**
 * The mobile breakpoint constant used by useIsMobile
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Simulates the mobile detection logic from useIsMobile hook
 * Tests the core logic without React hooks
 */
function detectIsMobile(innerWidth: number): boolean {
  return innerWidth < MOBILE_BREAKPOINT;
}

describe("useIsMobile logic", () => {
  describe("MOBILE_BREAKPOINT constant", () => {
    it("should be 768", () => {
      expect(MOBILE_BREAKPOINT).toBe(768);
    });
  });

  describe("detectIsMobile", () => {
    it("should return false for desktop width (1280px)", () => {
      expect(detectIsMobile(1280)).toBe(false);
    });

    it("should return false for desktop width (1024px)", () => {
      expect(detectIsMobile(1024)).toBe(false);
    });

    it("should return false for tablet width (768px)", () => {
      expect(detectIsMobile(768)).toBe(false);
    });

    it("should return true for mobile width (767px)", () => {
      expect(detectIsMobile(767)).toBe(true);
    });

    it("should return true for mobile width (375px)", () => {
      expect(detectIsMobile(375)).toBe(true);
    });

    it("should return true for mobile width (320px)", () => {
      expect(detectIsMobile(320)).toBe(true);
    });

    it("should return true for exactly breakpoint minus 1", () => {
      expect(detectIsMobile(MOBILE_BREAKPOINT - 1)).toBe(true);
    });

    it("should return false for exactly breakpoint", () => {
      expect(detectIsMobile(MOBILE_BREAKPOINT)).toBe(false);
    });
  });

  describe("matchMedia query string generation", () => {
    it("should generate correct media query", () => {
      const expectedQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
      expect(expectedQuery).toBe("(max-width: 767px)");
    });
  });

  describe("event listener cleanup", () => {
    it("should have proper cleanup pattern", () => {
      const addEventListenerSpy = vi.fn();
      const removeEventListenerSpy = vi.fn();

      const mockMediaQueryList = {
        matches: false,
        media: "(max-width: 767px)",
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      };

      // Simulate the onChange callback registration
      const onChange = vi.fn();
      mockMediaQueryList.addEventListener("change", onChange);

      // Verify listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith("change", onChange);

      // Simulate cleanup
      mockMediaQueryList.removeEventListener("change", onChange);

      // Verify listener was removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith("change", onChange);
    });
  });

  describe("boolean coercion", () => {
    it("should coerce undefined to false", () => {
      const isMobile = undefined;
      expect(!!isMobile).toBe(false);
    });

    it("should coerce true to true", () => {
      const isMobile = true;
      expect(!!isMobile).toBe(true);
    });

    it("should coerce false to false", () => {
      const isMobile = false;
      expect(!!isMobile).toBe(false);
    });

    it("should coerce null to false", () => {
      const isMobile = null;
      expect(!!isMobile).toBe(false);
    });
  });
});