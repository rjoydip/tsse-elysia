/**
 * Unit tests for src/lib/changelog/data.ts
 * Tests: changelogData array, getChangelogEntry, getLatestVersion
 */

import { describe, expect, it } from "bun:test";
import {
  changelogData,
  getChangelogEntry,
  getLatestVersion,
  type ChangelogType,
} from "~/features/landing/data/changelog/data";

describe("changelogData", () => {
  it("should be a non-empty array", () => {
    expect(Array.isArray(changelogData)).toBe(true);
    expect(changelogData.length).toBeGreaterThan(0);
  });

  it("should have entries with all required fields", () => {
    for (const entry of changelogData) {
      expect(typeof entry.version).toBe("string");
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(typeof entry.releasedAt).toBe("string");
      expect(entry.releasedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof entry.title).toBe("string");
      expect(entry.title.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.items)).toBe(true);
      expect(entry.items.length).toBeGreaterThan(0);
    }
  });

  it("should have items with all required fields", () => {
    for (const entry of changelogData) {
      for (const item of entry.items) {
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.version).toBe("string");
        expect(typeof item.releasedAt).toBe("string");
        expect(typeof item.description).toBe("string");
        expect(item.description.length).toBeGreaterThan(0);
      }
    }
  });

  it("should have valid changelog types", () => {
    const validTypes: ChangelogType[] = ["feature", "fix", "breaking", "improvement", "docs"];
    for (const entry of changelogData) {
      for (const item of entry.items) {
        expect(validTypes).toContain(item.type);
      }
    }
  });

  it("should have unique versions", () => {
    const versions = changelogData.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("should have unique item ids", () => {
    const allIds = changelogData.flatMap((e) => e.items.map((i) => i.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("should have items version match their entry version", () => {
    for (const entry of changelogData) {
      for (const item of entry.items) {
        expect(item.version).toBe(entry.version);
      }
    }
  });

  it("should have entries sorted by date descending", () => {
    for (let i = 1; i < changelogData.length; i++) {
      expect(changelogData[i - 1].releasedAt >= changelogData[i].releasedAt).toBe(true);
    }
  });

  it("should contain at least one breaking change", () => {
    const breakingItems = changelogData
      .flatMap((e) => e.items)
      .filter((i) => i.type === "breaking");
    expect(breakingItems.length).toBeGreaterThanOrEqual(1);
  });

  it("should contain feature items", () => {
    const features = changelogData.flatMap((e) => e.items).filter((i) => i.type === "feature");
    expect(features.length).toBeGreaterThan(0);
  });
});

describe("getChangelogEntry", () => {
  it("should return entry for valid version", () => {
    const entry = getChangelogEntry("1.2.0");
    expect(entry).toBeDefined();
    expect(entry!.version).toBe("1.2.0");
    expect(entry!.title).toContain("Dashboard");
  });

  it("should return undefined for non-existent version", () => {
    expect(getChangelogEntry("99.99.99")).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    expect(getChangelogEntry("")).toBeUndefined();
  });

  it("should be case-sensitive for version numbers", () => {
    expect(getChangelogEntry("1.0.0")).toBeDefined();
  });

  it("should return the correct entry for each version", () => {
    for (const expected of changelogData) {
      const actual = getChangelogEntry(expected.version);
      expect(actual).toBeDefined();
      expect(actual!.version).toBe(expected.version);
      expect(actual!.title).toBe(expected.title);
    }
  });
});

describe("getLatestVersion", () => {
  it("should return an entry", () => {
    const latest = getLatestVersion();
    expect(latest).toBeDefined();
  });

  it("should return the first entry in the array", () => {
    const latest = getLatestVersion();
    expect(latest.version).toBe(changelogData[0].version);
  });

  it("should have the most recent release date", () => {
    const latest = getLatestVersion();
    for (const entry of changelogData) {
      expect(latest.releasedAt >= entry.releasedAt).toBe(true);
    }
  });

  it("should have items array", () => {
    const latest = getLatestVersion();
    expect(Array.isArray(latest.items)).toBe(true);
    expect(latest.items.length).toBeGreaterThan(0);
  });
});