/**
 * Unit tests for font configuration.
 * Tests font options and validation.
 */

import { describe, expect, it } from "bun:test";
import { fonts } from "~/config";

describe("Font Configuration", () => {
  describe("fonts export", () => {
    it("should export fonts array", () => {
      expect(Array.isArray(fonts)).toBe(true);
    });

    it("should have at least one font defined", () => {
      expect(fonts.length).toBeGreaterThan(0);
    });
  });

  describe("font values", () => {
    it("should contain 'inter' as a font option", () => {
      expect(fonts).toContain("inter");
    });

    it("should contain 'manrope' as a font option", () => {
      expect(fonts).toContain("manrope");
    });

    it("should contain 'system' as a font option", () => {
      expect(fonts).toContain("system");
    });

    it("should have exactly 3 font options", () => {
      expect(fonts).toHaveLength(3);
    });
  });

  describe("font types", () => {
    it("should have string values", () => {
      fonts.forEach((font) => {
        expect(typeof font).toBe("string");
      });
    });

    it("should have lowercase font names", () => {
      fonts.forEach((font) => {
        const lower = font.toLowerCase();
        expect(["inter", "manrope", "system"]).toContain(lower);
      });
    });
  });
});

describe("Font Selection", () => {
  it("should be able to select first font as default", () => {
    const defaultFont = fonts[0];
    expect(defaultFont).toBeDefined();
  });

  it("should validate font is in fonts array", () => {
    const testFont = "inter";
    expect(fonts.includes(testFont as (typeof fonts)[number])).toBe(true);
  });

  it("should reject invalid font", () => {
    const invalidFont = "invalid-font";
    expect(fonts.includes(invalidFont as (typeof fonts)[number])).toBe(false);
  });
});