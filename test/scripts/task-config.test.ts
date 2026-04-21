/**
 * Unit tests for scripts/task-config.ts
 * Tests: task configuration structure and types
 */

import { describe, expect, it } from "bun:test";
import { taskConfig, type TaskConfig } from "../../scripts/task-config";

describe("taskConfig", () => {
  it("should have correct tasksFile path", () => {
    expect(taskConfig.tasksFile).toBe("knowledge/TASKS.md");
  });

  it("should have issueLabels as array", () => {
    expect(Array.isArray(taskConfig.issueLabels)).toBe(true);
    expect(taskConfig.issueLabels).toContain("auto-created");
  });

  it("should have null issueProject", () => {
    expect(taskConfig.issueProject).toBeNull();
  });

  it("should have logMissingOnly as boolean", () => {
    expect(typeof taskConfig.logMissingOnly).toBe("boolean");
    expect(taskConfig.logMissingOnly).toBe(true);
  });

  it("should be frozen (readonly)", () => {
    const frozen = Object.isFrozen(taskConfig);
    const frozenArray = Object.isFrozen(taskConfig.issueLabels);
    expect(frozen || frozenArray).toBe(true);
  });
});

describe("TaskConfig type", () => {
  it("should match expected structure", () => {
    const config: TaskConfig = {
      tasksFile: "knowledge/TASKS.md",
      issueLabels: ["test"],
      issueProject: null,
      logMissingOnly: true,
    };

    expect(config.tasksFile).toBe("knowledge/TASKS.md");
    expect(config.issueLabels).toHaveLength(1);
    expect(config.issueProject).toBeNull();
    expect(config.logMissingOnly).toBe(true);
  });
});