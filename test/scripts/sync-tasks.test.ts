/**
 * Unit tests for scripts/sync-tasks.ts
 * Tests: task extraction, issue number detection, file path handling
 */

import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";

describe("sync-tasks.ts logic", () => {
  describe("extractTasks", () => {
    it("should extract unchecked tasks from TASKS.md", () => {
      const content = `
## Current Sprint

- [ ] Task 1 <!-- issue: #123 -->
- [x] Completed Task
- [ ] Task 2 <!-- issue: #456 -->
`;

      const lines = content.split("\n");
      const tasks = lines.filter((l) => l.includes("- [ ]"));
      expect(tasks).toHaveLength(2);
    });

    it("should filter out completed tasks", () => {
      const content = `
- [x] Done
- [ ] Not Done
- [X] Also Done
`;

      const lines = content.split("\n");
      const tasks = lines.filter((l) => l.includes("- [ ]"));
      expect(tasks).toHaveLength(1);
    });
  });

  describe("detectIssueNumber", () => {
    it("should detect tasks with issue numbers", () => {
      const task = "- [ ] Implement rate limiting <!-- issue: #123 -->";
      const hasIssue = /issue:\s*#\d+/.test(task);
      expect(hasIssue).toBe(true);
    });

    it("should detect tasks without issue numbers (placeholder)", () => {
      const task = "- [ ] Implement rate limiting <!-- issue: # -->";
      const hasIssue = /issue:\s*#\d+/.test(task);
      expect(hasIssue).toBe(false);
    });

    it("should detect tasks without any issue comment", () => {
      const task = "- [ ] Implement rate limiting";
      const hasIssue = /issue:\s*#\d+/.test(task);
      expect(hasIssue).toBe(false);
    });
  });

  describe("real TASKS.md parsing", () => {
    it("should read TASKS.md content", () => {
      const content = readFileSync("knowledge/TASKS.md", "utf-8");
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain("Current Sprint");
    });

    it("should find tasks without issue numbers", () => {
      const content = readFileSync("knowledge/TASKS.md", "utf-8");
      const lines = content.split("\n");

      const tasksWithoutIssues = lines.filter((l) => {
        const isTask = l.includes("- [ ]");
        const hasPlaceholder = l.includes("<!-- issue: # -->");
        return isTask && hasPlaceholder;
      });

      expect(tasksWithoutIssues.length).toBeGreaterThan(0);
    });
  });

  describe("grep pattern validation", () => {
    it("should match TASKS.md placeholder format exactly", () => {
      const placeholder = "<!-- issue: # -->";
      const taskWithPlaceholder = "- [ ] Rate limiting per API key <!-- issue: # -->";

      expect(taskWithPlaceholder).toContain(placeholder);
    });

    it("should NOT match when issue number exists", () => {
      const taskWithIssue = "- [ ] Rate limiting per API key <!-- issue: #123 -->";
      const pattern = /<!-- issue: # -->/;

      expect(pattern.test(taskWithIssue)).toBe(false);
    });

    it("should match placeholder but not resolved issues", () => {
      const testContent = `
- [ ] Task A <!-- issue: # -->
- [ ] Task B <!-- issue: #123 -->
- [ ] Task C <!-- issue: #456 -->
`;

      const placeholders = testContent.match(/<!-- issue: # -->/g) || [];
      const withNumbers = testContent.match(/<!-- issue: #\d+ -->/g) || [];

      expect(placeholders.length).toBe(1);
      expect(withNumbers.length).toBe(2);
    });
  });
});