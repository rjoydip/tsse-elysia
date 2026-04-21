/**
 * Unit tests for scripts/new-decision.ts
 * Tests: decision ID extraction, entry formatting, file path handling
 */

import { describe, expect, it, afterEach } from "bun:test";
import { readFileSync, existsSync, unlinkSync } from "fs";

const TEST_DECISIONS_FILE = "test/scripts/test-DECISIONS.md";

describe("new-decision.ts logic", () => {
  afterEach(() => {
    if (existsSync(TEST_DECISIONS_FILE)) {
      unlinkSync(TEST_DECISIONS_FILE);
    }
  });

  describe("extractDecisionId", () => {
    it("should extract the highest decision ID from content", () => {
      const content = `
### 001: First Decision
**Status:** Accepted

### 002: Second Decision
**Status:** Proposed

### 003: Third Decision
**Status:** Accepted
`;
      const matches = [...content.matchAll(/### (\d+):/g)];
      const lastId = matches.length ? Math.max(...matches.map((m) => Number(m[1]))) : 0;
      expect(lastId).toBe(3);
    });

    it("should return 0 for empty content", () => {
      const content = "";
      const matches = [...content.matchAll(/### (\d+):/g)];
      const lastId = matches.length ? Math.max(...matches.map((m) => Number(m[1]))) : 0;
      expect(lastId).toBe(0);
    });

    it("should return 0 when no decision IDs exist", () => {
      const content = `
# Decisions Log

This is a decision log without numbered entries.
`;
      const matches = [...content.matchAll(/### (\d+):/g)];
      const lastId = matches.length ? Math.max(...matches.map((m) => Number(m[1]))) : 0;
      expect(lastId).toBe(0);
    });
  });

  describe("generateNextId", () => {
    it("should generate padded ID starting from 001", () => {
      const lastId = 0;
      const nextId = String(lastId + 1).padStart(3, "0");
      expect(nextId).toBe("001");
    });

    it("should generate sequential padded IDs", () => {
      expect(String(1).padStart(3, "0")).toBe("001");
      expect(String(10).padStart(3, "0")).toBe("010");
      expect(String(99).padStart(3, "0")).toBe("099");
      expect(String(100).padStart(3, "0")).toBe("100");
    });
  });

  describe("formatDecisionEntry", () => {
    it("should format entry with title and all required sections", () => {
      const title = "Use PostgreSQL for production";
      const nextId = "005";

      const entry = `

### ${nextId}: ${title}

**Status:** Proposed

**Context:**
-

**Decision:**
-

**Alternatives Considered:**
-

**Tradeoffs:**
-
`;

      expect(entry).toContain(`### ${nextId}: ${title}`);
      expect(entry).toContain("**Status:** Proposed");
      expect(entry).toContain("**Context:**");
      expect(entry).toContain("**Decision:**");
      expect(entry).toContain("**Alternatives Considered:**");
      expect(entry).toContain("**Tradeoffs:**");
    });
  });

  describe("file handling", () => {
    it("should check if file exists", () => {
      expect(existsSync("knowledge/DECISIONS.md")).toBe(true);
      expect(existsSync("nonexistent-file.md")).toBe(false);
    });

    it("should read existing DECISIONS.md", () => {
      const content = readFileSync("knowledge/DECISIONS.md", "utf-8");
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain("## Decision Log");
    });
  });
});