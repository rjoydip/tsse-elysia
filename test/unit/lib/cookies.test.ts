/**
 * Unit tests for src/lib/cookies.ts
 * Tests: getCookie, setCookie, removeCookie
 */

import { describe, expect, it } from "bun:test";
import { getCookie, setCookie, removeCookie } from "~/lib/cookies";

describe("cookies", () => {
  describe("getCookie", () => {
    it("is a function", () => {
      expect(typeof getCookie).toBe("function");
    });
  });

  describe("setCookie", () => {
    it("is a function", () => {
      expect(typeof setCookie).toBe("function");
    });

    it("accepts name, value, and maxAge parameters", () => {
      expect(() => setCookie("test", "value", 60)).not.toThrow();
    });
  });

  describe("removeCookie", () => {
    it("is a function", () => {
      expect(typeof removeCookie).toBe("function");
    });

    it("accepts name parameter", () => {
      expect(() => removeCookie("test")).not.toThrow();
    });
  });
});