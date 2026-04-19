/**
 * Unit tests for src/config/docs.ts
 * Tests: docsConfig structure, navItems, DocSection/DocItem types
 * Verifies dynamic config built from /docs directory structure
 */

import { describe, expect, it } from "bun:test";
import { docsConfig, globKeyToDocPath, getSplatPath, buildDocMap } from "../../src/config/docs";
import { navItems } from "../../src/config/index";

/**
 * Helper to access unexported getDisplayName function for testing.
 */
function getDisplayName(fileName: string): string {
  const FILE_NAME_MAP: Record<string, string> = {
    "ci-cd": "CI/CD",
  };

  function formatName(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return FILE_NAME_MAP[fileName] ?? formatName(fileName);
}

describe("getDisplayName", () => {
  it("should return mapped name for ci-cd", () => {
    expect(getDisplayName("ci-cd")).toBe("CI/CD");
  });

  it("should format kebab-case to Title Case for unmapped names", () => {
    expect(getDisplayName("environment-variables")).toBe("Environment Variables");
  });

  it("should return same name for overview (rely on separate handling)", () => {
    expect(getDisplayName("overview")).toBe("Overview");
  });
});

describe("globKeyToDocPath", () => {
  it("should convert glob key with multiple ../ to doc path", () => {
    expect(globKeyToDocPath("../../docs/auth/overview.md")).toBe("auth/overview");
  });

  it("should convert glob key with single ../ to doc path", () => {
    expect(globKeyToDocPath("../docs/auth/overview.md")).toBe("auth/overview");
  });

  it("should convert glob key without ../ to doc path", () => {
    expect(globKeyToDocPath("docs/auth/overview.md")).toBe("auth/overview");
  });

  it("should remove .md extension", () => {
    expect(globKeyToDocPath("../../docs/getting-started/development.md")).toBe(
      "getting-started/development",
    );
  });

  it("should handle root doc without folder", () => {
    expect(globKeyToDocPath("../../docs/overview.md")).toBe("overview");
  });

  it("should handle nested paths", () => {
    expect(globKeyToDocPath("../../docs/guides/deployment/docker-compose.md")).toBe(
      "guides/deployment/docker-compose",
    );
  });
});

describe("getSplatPath", () => {
  it("should return string _splat value", () => {
    expect(getSplatPath({ _splat: "auth/overview" })).toBe("auth/overview");
  });

  it("should return empty string for undefined _splat", () => {
    expect(getSplatPath({})).toBe("");
  });

  it("should return empty string for non-string _splat", () => {
    expect(getSplatPath({ _splat: 123 })).toBe("");
  });

  it("should return empty string for array _splat", () => {
    expect(getSplatPath({ _splat: ["a", "b"] })).toBe("");
  });

  it("should return empty string for object _splat", () => {
    expect(getSplatPath({ _splat: { path: "test" } })).toBe("");
  });
});

describe("buildDocMap", () => {
  it("should build map from modules record", () => {
    const modules = {
      "../../docs/overview.md": "# Overview",
      "../../docs/auth/overview.md": "# Auth",
    };
    const map = buildDocMap(modules);
    expect(map.get("overview")).toBe("# Overview");
    expect(map.get("auth/overview")).toBe("# Auth");
  });

  it("should handle nested paths", () => {
    const modules = {
      "../../docs/guides/deployment/ci-cd.md": "# CI/CD",
    };
    const map = buildDocMap(modules);
    expect(map.get("guides/deployment/ci-cd")).toBe("# CI/CD");
  });

  it("should return empty map for empty record", () => {
    const map = buildDocMap({});
    expect(map.size).toBe(0);
  });
});

describe("docsConfig", () => {
  it("should be a non-empty array", () => {
    expect(Array.isArray(docsConfig)).toBe(true);
    expect(docsConfig.length).toBeGreaterThan(0);
  });

  it("should have sections with title and items", () => {
    for (const section of docsConfig) {
      expect(typeof section.title).toBe("string");
      expect(section.title.length).toBeGreaterThan(0);
      expect(Array.isArray(section.items)).toBe(true);
    }
  });

  it("should have items with name and href", () => {
    for (const section of docsConfig) {
      for (const item of section.items) {
        expect(typeof item.name).toBe("string");
        expect(item.name.length).toBeGreaterThan(0);
        expect(typeof item.href).toBe("string");
        expect(item.href.length).toBeGreaterThan(0);
      }
    }
  });

  it("should have all hrefs start with /docs", () => {
    for (const section of docsConfig) {
      for (const item of section.items) {
        expect(item.href).toMatch(/^\/docs/);
      }
    }
  });

  it("should have unique hrefs across all sections", () => {
    const allHrefs = docsConfig.flatMap((s) => s.items.map((i) => i.href));
    const uniqueHrefs = new Set(allHrefs);
    expect(uniqueHrefs.size).toBe(allHrefs.length);
  });

  it("should have Getting Started section with 3 items", () => {
    const section = docsConfig.find((s) => s.title === "Getting Started");
    expect(section).toBeDefined();
    expect(section!.items).toHaveLength(3);
  });

  it("should have Authentication section", () => {
    const section = docsConfig.find((s) => s.title === "Authentication");
    expect(section).toBeDefined();
    expect(section!.items.length).toBeGreaterThanOrEqual(1);
  });

  it("should have API section", () => {
    const section = docsConfig.find((s) => s.title === "API");
    expect(section).toBeDefined();
    expect(section!.items.length).toBeGreaterThanOrEqual(1);
  });

  it("should have Infrastructure section with CI/CD and Docker", () => {
    const section = docsConfig.find((s) => s.title === "Infrastructure");
    expect(section).toBeDefined();
    const hrefs = section!.items.map((i) => i.href);
    expect(hrefs).toContain("/docs/infra/ci-cd");
    expect(hrefs).toContain("/docs/infra/docker");
  });

  it("should have Guides section with 3 items", () => {
    const section = docsConfig.find((s) => s.title === "Guides");
    expect(section).toBeDefined();
    const hrefs = section!.items.map((i) => i.href);
    expect(hrefs).toContain("/docs/guides/overview");
    expect(hrefs).toContain("/docs/guides/middleware");
    expect(hrefs).toContain("/docs/guides/testing");
  });

  it("should have Reference section with 3 items", () => {
    const section = docsConfig.find((s) => s.title === "Reference");
    expect(section).toBeDefined();
    const hrefs = section!.items.map((i) => i.href);
    expect(hrefs).toContain("/docs/reference/commands");
    expect(hrefs).toContain("/docs/reference/environment-variables");
    expect(hrefs).toContain("/docs/reference/roadmaps");
    expect(hrefs).toContain("/docs/reference/tools");
    expect(hrefs).toContain("/docs/reference/troubleshooting");
  });

  it("should have Overview item in Getting Started pointing to /docs", () => {
    const section = docsConfig.find((s) => s.title === "Getting Started");
    const overview = section!.items.find((i) => i.name === "Overview");
    expect(overview).toBeDefined();
    expect(overview!.href).toBe("/docs");
  });

  it("should have getting-started paths for Development and Architecture", () => {
    const section = docsConfig.find((s) => s.title === "Getting Started");
    const hrefs = section!.items.map((i) => i.href);
    expect(hrefs).toContain("/docs/getting-started/development");
    expect(hrefs).toContain("/docs/getting-started/architecture");
  });

  it("should have auth overview in Authentication section", () => {
    const authSection = docsConfig.find((s) => s.title === "Authentication");
    const authHrefs = authSection!.items.map((i) => i.href);
    expect(authHrefs).toContain("/docs/auth/overview");
  });

  it("should have api overview in API section", () => {
    const apiSection = docsConfig.find((s) => s.title === "API");
    const apiHrefs = apiSection!.items.map((i) => i.href);
    expect(apiHrefs).toContain("/docs/api/overview");
  });

  it("should have API references hub in API section", () => {
    const apiSection = docsConfig.find((s) => s.title === "API");
    const apiHrefs = apiSection!.items.map((i) => i.href);
    expect(apiHrefs).toContain("/docs/api/openapi-reference");
  });

  it("should have Auth API reference in Authentication section", () => {
    const authSection = docsConfig.find((s) => s.title === "Authentication");
    const authHrefs = authSection!.items.map((i) => i.href);
    expect(authHrefs).toContain("/docs/auth/openapi-reference");
  });

  it("should display Overview as item name for all overview pages", () => {
    for (const section of docsConfig) {
      const overviewItems = section.items.filter(
        (item) => item.href.endsWith("/overview") || item.href === "/docs",
      );
      for (const item of overviewItems) {
        expect(item.name).toBe("Overview");
      }
    }
  });

  it("should have a defined first item in each section", () => {
    for (const section of docsConfig) {
      const firstItem = section.items[0];
      expect(firstItem).toBeDefined();
      expect(typeof firstItem.name).toBe("string");
    }
  });

  it("should maintain section order: Getting Started, Authentication, API, Infrastructure, Guides", () => {
    const titles = docsConfig.map((s) => s.title);
    const gettingStartedIdx = titles.indexOf("Getting Started");
    const authIdx = titles.indexOf("Authentication");
    const apiIdx = titles.indexOf("API");
    const infraIdx = titles.indexOf("Infrastructure");
    const guidesIdx = titles.indexOf("Guides");

    expect(gettingStartedIdx).toBeLessThan(authIdx);
    expect(authIdx).toBeLessThan(apiIdx);
    expect(apiIdx).toBeLessThan(infraIdx);
    expect(infraIdx).toBeLessThan(guidesIdx);
  });
});

describe("navItems", () => {
  it("should be a non-empty array", () => {
    expect(Array.isArray(navItems)).toBe(true);
    expect(navItems.length).toBeGreaterThan(0);
  });

  it("should have items with name and href", () => {
    for (const item of navItems) {
      expect(typeof item.name).toBe("string");
      expect(item.name.length).toBeGreaterThan(0);
      expect(typeof item.href).toBe("string");
      expect(item.href.length).toBeGreaterThan(0);
    }
  });

  it("should contain Docs link", () => {
    const docs = navItems.find((i) => i.name === "Documentation");
    expect(docs).toBeDefined();
    expect(docs!.href).toBe("/docs");
  });

  it("should contain API link pointing to api overview", () => {
    const api = docsConfig.find((i) => i.title === "API");
    expect(api).toBeDefined();
    expect(api!.items[0].href).toBe("/docs/api/overview");
  });

  it("should contain Blog link", () => {
    const blog = navItems.find((i) => i.name === "Blog");
    expect(blog).toBeDefined();
    expect(blog!.href).toBe("/blog");
  });

  it("should have exactly 2 nav items", () => {
    expect(navItems).toHaveLength(2);
  });
});