/**
 * Unit tests for validateCreateTaskRequest in src/controllers/tasks/controller.ts.
 * Tests body validation edge cases: missing title, empty title, non-string title,
 * and correct parsing of optional fields.
 */

import { describe, it, expect } from "bun:test";

const { validateCreateTaskRequest } = await import("~/controllers/tasks/controller");

describe("validateCreateTaskRequest", () => {
  it("should return parsed data for a valid body", async () => {
    const result = await validateCreateTaskRequest({
      title: "  My Task  ",
      description: "A description",
      status: "todo",
      priority: "high",
      label: "bug",
      dueDate: "2026-12-31",
      assignee: "user-2",
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({
      title: "My Task",
      description: "A description",
      status: "todo",
      priority: "high",
      label: "bug",
      dueDate: "2026-12-31",
      assignee: "user-2",
    });
  });

  it("should return parsed data with only required field", async () => {
    const result = await validateCreateTaskRequest({ title: "Minimal" });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({
      title: "Minimal",
      description: undefined,
      status: undefined,
      priority: undefined,
      label: undefined,
      dueDate: undefined,
      assignee: undefined,
    });
  });

  it("should return 400 error when title is missing", async () => {
    const result = await validateCreateTaskRequest({});

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(400);
  });

  it("should return 400 error when title is empty string", async () => {
    const result = await validateCreateTaskRequest({ title: "" });

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(400);
  });

  it("should return 400 error when title is only whitespace", async () => {
    const result = await validateCreateTaskRequest({ title: "   " });

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(400);
  });

  it("should return 400 error when title is not a string", async () => {
    const result = await validateCreateTaskRequest({ title: 123 });

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(400);
  });

  it("should ignore non-string optional fields", async () => {
    const result = await validateCreateTaskRequest({
      title: "Valid",
      description: 123,
      status: true,
      priority: [],
      label: null,
      dueDate: 456,
      assignee: {},
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({
      title: "Valid",
      description: undefined,
      status: undefined,
      priority: undefined,
      label: undefined,
      dueDate: undefined,
      assignee: undefined,
    });
  });

  it("should accept numeric string dueDate", async () => {
    const result = await validateCreateTaskRequest({
      title: "Task",
      dueDate: "1718000000",
    });

    expect(result.error).toBeUndefined();
    expect(result.data!.dueDate).toBe("1718000000");
  });
});