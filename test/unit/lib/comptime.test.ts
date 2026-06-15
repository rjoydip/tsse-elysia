/**
 * Unit tests for src/lib/comptime/values.ts
 * Tests the constant values that are sources for build-time computations.
 */

import { describe, expect, it } from "bun:test";
import {
  ROLE_HIERARCHY_VALUES,
  ADMIN_ROLES_VALUES,
  MANAGER_ROLES_VALUES,
  ALL_ROLES_VALUES,
  DASHBOARD_VIEWS_VALUES,
  DASHBOARD_VIEW_LEVELS_VALUES,
  HTTP_STATUS_TO_ERROR_MAP_VALUES,
  HTML_ENTITIES_MAP_VALUES,
  SUSPICIOUS_PATTERNS_VALUES,
  DANGEROUS_TAGS_PATTERN_SOURCE,
  EVENT_HANDLER_PATTERN_SOURCE,
  HTML_PATTERN_SOURCE,
  PAGINATION_MAX_VISIBLE_VALUE,
} from "~/lib/comptime/values";

describe("ROLE_HIERARCHY_VALUES", () => {
  it("should have correct numeric values for all roles", () => {
    expect(ROLE_HIERARCHY_VALUES.user).toBe(0);
    expect(ROLE_HIERARCHY_VALUES.cashier).toBe(1);
    expect(ROLE_HIERARCHY_VALUES.manager).toBe(2);
    expect(ROLE_HIERARCHY_VALUES.admin).toBe(3);
  });

  it("should have higher values for higher privilege roles", () => {
    expect(ROLE_HIERARCHY_VALUES.admin).toBeGreaterThan(ROLE_HIERARCHY_VALUES.manager);
    expect(ROLE_HIERARCHY_VALUES.manager).toBeGreaterThan(ROLE_HIERARCHY_VALUES.cashier);
    expect(ROLE_HIERARCHY_VALUES.cashier).toBeGreaterThan(ROLE_HIERARCHY_VALUES.user);
  });

  it("should have exactly 4 roles defined", () => {
    expect(Object.keys(ROLE_HIERARCHY_VALUES).length).toBe(4);
  });
});

describe("Role Arrays", () => {
  describe("ALL_ROLES_VALUES", () => {
    it("should contain all 4 roles", () => {
      expect(ALL_ROLES_VALUES).toContain("user");
      expect(ALL_ROLES_VALUES).toContain("cashier");
      expect(ALL_ROLES_VALUES).toContain("manager");
      expect(ALL_ROLES_VALUES).toContain("admin");
      expect(ALL_ROLES_VALUES.length).toBe(4);
    });

    it("should have roles ordered from lowest to highest privilege", () => {
      expect(ALL_ROLES_VALUES[0]).toBe("user");
      expect(ALL_ROLES_VALUES[ALL_ROLES_VALUES.length - 1]).toBe("admin");
    });
  });

  describe("ADMIN_ROLES_VALUES", () => {
    it("should contain exactly admin", () => {
      expect(ADMIN_ROLES_VALUES).toContain("admin");
      expect(ADMIN_ROLES_VALUES.length).toBe(1);
    });
  });

  describe("MANAGER_ROLES_VALUES", () => {
    it("should contain manager and admin", () => {
      expect(MANAGER_ROLES_VALUES).toContain("manager");
      expect(MANAGER_ROLES_VALUES).toContain("admin");
      expect(MANAGER_ROLES_VALUES.length).toBe(2);
    });
  });
});

describe("DASHBOARD_VIEWS_VALUES", () => {
  it("should contain all 5 dashboard view types", () => {
    expect(DASHBOARD_VIEWS_VALUES).toContain("full");
    expect(DASHBOARD_VIEWS_VALUES).toContain("analytics");
    expect(DASHBOARD_VIEWS_VALUES).toContain("team");
    expect(DASHBOARD_VIEWS_VALUES).toContain("sales");
    expect(DASHBOARD_VIEWS_VALUES).toContain("basic");
    expect(DASHBOARD_VIEWS_VALUES.length).toBe(5);
  });
});

describe("DASHBOARD_VIEW_LEVELS_VALUES", () => {
  it("should have correct numeric values for all views", () => {
    expect(DASHBOARD_VIEW_LEVELS_VALUES.basic).toBe(0);
    expect(DASHBOARD_VIEW_LEVELS_VALUES.sales).toBe(1);
    expect(DASHBOARD_VIEW_LEVELS_VALUES.team).toBe(2);
    expect(DASHBOARD_VIEW_LEVELS_VALUES.analytics).toBe(3);
    expect(DASHBOARD_VIEW_LEVELS_VALUES.full).toBe(4);
  });

  it("should have higher values for more privileged views", () => {
    expect(DASHBOARD_VIEW_LEVELS_VALUES.full).toBeGreaterThan(
      DASHBOARD_VIEW_LEVELS_VALUES.analytics,
    );
    expect(DASHBOARD_VIEW_LEVELS_VALUES.analytics).toBeGreaterThan(
      DASHBOARD_VIEW_LEVELS_VALUES.team,
    );
    expect(DASHBOARD_VIEW_LEVELS_VALUES.team).toBeGreaterThan(DASHBOARD_VIEW_LEVELS_VALUES.sales);
    expect(DASHBOARD_VIEW_LEVELS_VALUES.sales).toBeGreaterThan(DASHBOARD_VIEW_LEVELS_VALUES.basic);
  });
});

describe("HTTP_STATUS_TO_ERROR_MAP_VALUES", () => {
  it("should map HTTP status codes to error type strings", () => {
    expect(HTTP_STATUS_TO_ERROR_MAP_VALUES[400]).toBe("ValidationError");
    expect(HTTP_STATUS_TO_ERROR_MAP_VALUES[404]).toBe("NotFoundError");
    expect(HTTP_STATUS_TO_ERROR_MAP_VALUES[409]).toBe("DuplicateKeyError");
    expect(HTTP_STATUS_TO_ERROR_MAP_VALUES[500]).toBe("DatabaseError");
  });

  it("should have exactly 4 status code mappings", () => {
    expect(Object.keys(HTTP_STATUS_TO_ERROR_MAP_VALUES).length).toBe(4);
  });
});

describe("HTML_ENTITIES_MAP_VALUES", () => {
  it("should contain all required HTML entities", () => {
    expect(HTML_ENTITIES_MAP_VALUES["&"]).toBe("&amp;");
    expect(HTML_ENTITIES_MAP_VALUES["<"]).toBe("&lt;");
    expect(HTML_ENTITIES_MAP_VALUES[">"]).toBe("&gt;");
    expect(HTML_ENTITIES_MAP_VALUES['"']).toBe("&quot;");
    expect(HTML_ENTITIES_MAP_VALUES["'"]).toBe("&#x27;");
    expect(HTML_ENTITIES_MAP_VALUES["/"]).toBe("&#x2F;");
  });

  it("should have exactly 6 HTML entity mappings", () => {
    expect(Object.keys(HTML_ENTITIES_MAP_VALUES).length).toBe(6);
  });

  it("should have properly escaped values", () => {
    expect(HTML_ENTITIES_MAP_VALUES["&"]).not.toBe("&");
    expect(HTML_ENTITIES_MAP_VALUES["<"]).not.toBe("<");
    expect(HTML_ENTITIES_MAP_VALUES[">"]).not.toBe(">");
  });
});

describe("SUSPICIOUS_PATTERNS_VALUES", () => {
  it("should contain exactly 8 XSS pattern definitions", () => {
    expect(SUSPICIOUS_PATTERNS_VALUES.length).toBe(8);
  });

  it("should include common XSS attack patterns", () => {
    const sources = SUSPICIOUS_PATTERNS_VALUES.map((p) => p.source);
    expect(sources.some((p) => p.includes("script"))).toBe(true);
    expect(sources.some((p) => p.includes("javascript"))).toBe(true);
    expect(sources.some((p) => p.includes("iframe"))).toBe(true);
    expect(sources.some((p) => p.includes("vbscript"))).toBe(true);
    expect(sources.some((p) => p.includes("data:"))).toBe(true);
  });

  it("should have all patterns with flags defined", () => {
    for (const pattern of SUSPICIOUS_PATTERNS_VALUES) {
      expect(pattern.source).toBeTruthy();
      expect(pattern.flags).toBeTruthy();
    }
  });
});

describe("DANGEROUS_TAGS_PATTERN_SOURCE", () => {
  it("should be a non-empty string", () => {
    expect(typeof DANGEROUS_TAGS_PATTERN_SOURCE).toBe("string");
    expect(DANGEROUS_TAGS_PATTERN_SOURCE.length).toBeGreaterThan(0);
  });

  it("should contain common dangerous tag names", () => {
    expect(DANGEROUS_TAGS_PATTERN_SOURCE).toContain("script");
    expect(DANGEROUS_TAGS_PATTERN_SOURCE).toContain("iframe");
    expect(DANGEROUS_TAGS_PATTERN_SOURCE).toContain("object");
  });
});

describe("EVENT_HANDLER_PATTERN_SOURCE", () => {
  it("should be a non-empty string", () => {
    expect(typeof EVENT_HANDLER_PATTERN_SOURCE).toBe("string");
    expect(EVENT_HANDLER_PATTERN_SOURCE.length).toBeGreaterThan(0);
  });

  it("should contain 'on' for event handler matching", () => {
    expect(EVENT_HANDLER_PATTERN_SOURCE).toContain("on");
  });
});

describe("HTML_PATTERN_SOURCE", () => {
  it("should be a non-empty string", () => {
    expect(typeof HTML_PATTERN_SOURCE).toBe("string");
    expect(HTML_PATTERN_SOURCE.length).toBeGreaterThan(0);
  });

  it("should include common HTML special characters", () => {
    expect(HTML_PATTERN_SOURCE).toContain("&");
    expect(HTML_PATTERN_SOURCE).toContain("<");
    expect(HTML_PATTERN_SOURCE).toContain(">");
  });
});

describe("PAGINATION_MAX_VISIBLE_VALUE", () => {
  it("should be set to 5 pages", () => {
    expect(PAGINATION_MAX_VISIBLE_VALUE).toBe(5);
  });
});

describe("Pagination Range Computation", () => {
  function computeRange(currentPage: number, totalPages: number): (number | string)[] {
    const maxVisiblePages = PAGINATION_MAX_VISIBLE_VALUE;
    const rangeWithDots: (number | string)[] = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        rangeWithDots.push(i);
      }
    } else {
      rangeWithDots.push(1);

      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          rangeWithDots.push(i);
        }
        rangeWithDots.push("...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        rangeWithDots.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          rangeWithDots.push(i);
        }
      } else {
        rangeWithDots.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          rangeWithDots.push(i);
        }
        rangeWithDots.push("...", totalPages);
      }
    }

    return rangeWithDots;
  }

  it("should generate correct range for single page", () => {
    expect(computeRange(1, 1)).toEqual([1]);
  });

  it("should generate correct range for small page counts (≤5)", () => {
    expect(computeRange(1, 3)).toEqual([1, 2, 3]);
    expect(computeRange(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("should include ellipsis for large page counts", () => {
    const range10page1 = computeRange(1, 10);
    expect(range10page1).toContain("...");

    const range10page5 = computeRange(5, 10);
    expect(range10page5).toContain("...");
  });

  it("should always start with page 1", () => {
    const range = computeRange(5, 20);
    expect(range[0]).toBe(1);
  });

  it("should not include ellipsis for small page counts", () => {
    expect(computeRange(1, 5)).not.toContain("...");
    expect(computeRange(5, 5)).not.toContain("...");
  });

  it("should generate near-beginning range correctly", () => {
    expect(computeRange(2, 10)).toEqual([1, 2, 3, 4, "...", 10]);
  });

  it("should generate near-end range correctly", () => {
    expect(computeRange(9, 10)).toEqual([1, "...", 7, 8, 9, 10]);
  });

  it("should generate middle range correctly", () => {
    expect(computeRange(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });
});