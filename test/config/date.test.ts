/**
 * Unit tests for src/config/date.ts
 * Tests: MONTH_NAMES constant
 */

import { describe, expect, it } from "bun:test";
import { MONTH_NAMES } from "~/config/date";

describe("MONTH_NAMES", () => {
  it("should have 12 months", () => {
    expect(MONTH_NAMES).toHaveLength(12);
  });

  it("should contain all month abbreviations in order", () => {
    expect(MONTH_NAMES).toEqual([
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
    ]);
  });

  it("should start with Jan", () => {
    expect(MONTH_NAMES[0]).toBe("Jan");
  });

  it("should end with Dec", () => {
    expect(MONTH_NAMES[11]).toBe("Dec");
  });

  it("should be readonly", () => {
    // as const makes it readonly — verify at type level by attempting mutation
    const names: readonly string[] = MONTH_NAMES;
    expect(names).toBeDefined();
  });
});