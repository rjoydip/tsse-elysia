/**
 * Unit tests for src/lib/pagination/compute.ts
 * Tests: computeRange and buildCache functions
 */

import { describe, expect, it } from "bun:test";
import { computeRange, buildCache } from "~/lib/pagination/compute";

describe("computeRange", () => {
  it("should return all pages for single page", () => {
    expect(computeRange(1, 1)).toEqual([1]);
  });

  it("should return all pages for two pages", () => {
    expect(computeRange(1, 2)).toEqual([1, 2]);
    expect(computeRange(2, 2)).toEqual([1, 2]);
  });

  it("should return all pages for small datasets (≤5)", () => {
    expect(computeRange(1, 3)).toEqual([1, 2, 3]);
    expect(computeRange(2, 4)).toEqual([1, 2, 3, 4]);
    expect(computeRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("should include ellipsis for large datasets near beginning", () => {
    expect(computeRange(1, 10)).toEqual([1, 2, 3, 4, "...", 10]);
    expect(computeRange(2, 10)).toEqual([1, 2, 3, 4, "...", 10]);
    expect(computeRange(3, 10)).toEqual([1, 2, 3, 4, "...", 10]);
  });

  it("should include ellipsis for large datasets near end", () => {
    expect(computeRange(8, 10)).toEqual([1, "...", 7, 8, 9, 10]);
    expect(computeRange(9, 10)).toEqual([1, "...", 7, 8, 9, 10]);
    expect(computeRange(10, 10)).toEqual([1, "...", 7, 8, 9, 10]);
  });

  it("should include ellipsis for large datasets in middle", () => {
    expect(computeRange(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
    expect(computeRange(6, 15)).toEqual([1, "...", 5, 6, 7, "...", 15]);
  });

  it("should always start with page 1", () => {
    expect(computeRange(5, 20)[0]).toBe(1);
    expect(computeRange(10, 20)[0]).toBe(1);
    expect(computeRange(15, 20)[0]).toBe(1);
  });

  it("should always end with total pages when ellipsis used", () => {
    const range1 = computeRange(1, 10);
    expect(range1[range1.length - 1]).toBe(10);

    const range2 = computeRange(5, 15);
    expect(range2[range2.length - 1]).toBe(15);

    const range3 = computeRange(10, 20);
    expect(range3[range3.length - 1]).toBe(20);
  });

  it("should handle edge case at boundary (5 pages)", () => {
    expect(computeRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("should return array with numbers and ellipsis strings", () => {
    const range = computeRange(5, 20);
    for (const item of range) {
      expect(typeof item === "number" || item === "...").toBe(true);
    }
  });
});

describe("buildCache", () => {
  it("should return a non-empty object", () => {
    const cache = buildCache();
    expect(Object.keys(cache).length).toBeGreaterThan(0);
  });

  it("should have entries for all page combinations 1-20", () => {
    const cache = buildCache();

    // Total pages from 1 to 20
    for (let totalPages = 1; totalPages <= 20; totalPages++) {
      // Current page from 1 to totalPages
      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        const key = `${currentPage}-${totalPages}`;
        expect(cache[key]).toBeDefined();
        expect(Array.isArray(cache[key])).toBe(true);
      }
    }
  });

  it("should match computeRange for all cached entries", () => {
    const cache = buildCache();

    for (let totalPages = 1; totalPages <= 20; totalPages++) {
      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        const key = `${currentPage}-${totalPages}`;
        const cached = cache[key];
        const computed = computeRange(currentPage, totalPages);
        expect(cached).toEqual(computed);
      }
    }
  });

  it("should not have duplicate entries", () => {
    const cache = buildCache();
    const keys = Object.keys(cache);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  it("should handle single page correctly", () => {
    const cache = buildCache();
    expect(cache["1-1"]).toEqual([1]);
  });

  it("should handle two pages correctly", () => {
    const cache = buildCache();
    expect(cache["1-2"]).toEqual([1, 2]);
    expect(cache["2-2"]).toEqual([1, 2]);
  });

  it("should handle page boundary at 20 correctly", () => {
    const cache = buildCache();
    expect(cache["1-20"]).toEqual([1, 2, 3, 4, "...", 20]);
    expect(cache["10-20"]).toEqual([1, "...", 9, 10, 11, "...", 20]);
    expect(cache["20-20"]).toEqual([1, "...", 17, 18, 19, 20]);
  });
});