/**
 * Unit tests for TasksService.
 * Tests business logic with a mocked repository.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test";
import { TasksService } from "~/services/tasks/tasks.service";
import type { TaskRow } from "~/repositories/tasks/tasks.repository";

// Mock the tasks repository
const mockTasksRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  archive: vi.fn(),
  unarchive: vi.fn(),
  softDelete: vi.fn(),
  stats: vi.fn(),
  getMonthlyCounts: vi.fn(),
};

vi.mock("~/repositories/tasks/tasks.repository", () => ({
  tasksRepository: mockTasksRepository,
}));

/**
 * Creates a complete mock TaskRow with defaults for all required fields.
 */
function createMockTask(overrides: Partial<TaskRow> = {}): TaskRow {
  const now = new Date();
  return {
    id: "1",
    title: "Test task",
    description: null,
    status: "todo",
    priority: "medium",
    label: "feature",
    dueDate: null,
    userId: "user-1",
    assignee: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe("TasksService", () => {
  let service: TasksService;

  beforeEach(() => {
    service = new TasksService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listTasks", () => {
    it("should fetch tasks from the repository", async () => {
      const mockData = { tasks: [createMockTask({ id: "1", title: "Test" })], total: 1 };
      mockTasksRepository.findAll.mockResolvedValueOnce(mockData);

      const result = await service.listTasks("user-1", { page: 1, pageSize: 10 });

      expect(mockTasksRepository.findAll).toHaveBeenCalledWith("user-1", { page: 1, pageSize: 10 });
      expect(result).toEqual(mockData);
    });
  });

  describe("createTask", () => {
    it("should create a task via the repository", async () => {
      const mockTask = createMockTask({ id: "1", title: "New Task", userId: "user-1" });
      mockTasksRepository.create.mockResolvedValueOnce(mockTask);

      const result = await service.createTask({
        title: "New Task",
        userId: "user-1",
      });

      expect(mockTasksRepository.create).toHaveBeenCalledWith({
        title: "New Task",
        userId: "user-1",
        description: undefined,
        status: undefined,
        priority: undefined,
        label: undefined,
        dueDate: undefined,
        assignee: undefined,
      });
      expect(result).toEqual(mockTask);
    });

    it("should convert dueDate string to Date when creating", async () => {
      const mockTask = createMockTask({ id: "1", title: "Task with due date", userId: "user-1" });
      mockTasksRepository.create.mockResolvedValueOnce(mockTask);

      await service.createTask({
        title: "Task with due date",
        userId: "user-1",
        dueDate: "2026-12-31",
      });

      expect(mockTasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: expect.any(Date),
        }),
      );
    });
  });

  describe("updateTask", () => {
    it("should update a task via the repository", async () => {
      const mockTaskRow = createMockTask({ id: "1", title: "Updated", userId: "user-1" });
      mockTasksRepository.update.mockResolvedValueOnce(mockTaskRow);

      const result = await service.updateTask("1", "user-1", { title: "Updated" });

      expect(mockTasksRepository.update).toHaveBeenCalledWith("1", "user-1", { title: "Updated" });
      expect(result).toEqual(mockTaskRow);
    });

    it("should return null when task not found", async () => {
      mockTasksRepository.update.mockResolvedValueOnce(null);

      const result = await service.updateTask("nonexistent", "user-1", { title: "Updated" });

      expect(result).toBeNull();
    });

    it("should convert dueDate string to epoch seconds", async () => {
      const mockTaskRow = createMockTask({ id: "1" });
      mockTasksRepository.update.mockResolvedValueOnce(mockTaskRow);

      const result = await service.updateTask("1", "user-1", { dueDate: "2026-12-31" });

      expect(mockTasksRepository.update).toHaveBeenCalledWith(
        "1",
        "user-1",
        expect.objectContaining({
          dueDate: 1798675200, // 2026-12-31T00:00:00.000Z in epoch seconds
        }),
      );
      expect(result).toEqual(mockTaskRow);
    });

    it("should clear dueDate when passed null", async () => {
      const mockTaskRow = createMockTask({ id: "1", dueDate: null });
      mockTasksRepository.update.mockResolvedValueOnce(mockTaskRow);

      const result = await service.updateTask("1", "user-1", { dueDate: null });

      expect(mockTasksRepository.update).toHaveBeenCalledWith(
        "1",
        "user-1",
        expect.objectContaining({
          dueDate: null,
        }),
      );
      expect(result).toEqual(mockTaskRow);
    });
  });

  describe("archiveTask", () => {
    it("should archive a task via the repository", async () => {
      const mockTaskRow = createMockTask({
        id: "1",
        title: "Archived",
        userId: "user-1",
        archivedAt: new Date(),
      });
      mockTasksRepository.archive.mockResolvedValueOnce(mockTaskRow);

      const result = await service.archiveTask("1", "user-1");

      expect(mockTasksRepository.archive).toHaveBeenCalledWith("1", "user-1");
      expect(result).toEqual(mockTaskRow);
    });
  });

  describe("unarchiveTask", () => {
    it("should unarchive a task via the repository", async () => {
      const mockTaskRow = createMockTask({
        id: "1",
        title: "Unarchived",
        userId: "user-1",
        archivedAt: null,
      });
      mockTasksRepository.unarchive.mockResolvedValueOnce(mockTaskRow);

      const result = await service.unarchiveTask("1", "user-1");

      expect(mockTasksRepository.unarchive).toHaveBeenCalledWith("1", "user-1");
      expect(result).toEqual(mockTaskRow);
    });
  });

  describe("deleteTask", () => {
    it("should soft-delete a task via the repository", async () => {
      const mockTaskRow = createMockTask({
        id: "1",
        title: "Deleted",
        userId: "user-1",
        deletedAt: new Date(),
      });
      mockTasksRepository.softDelete.mockResolvedValueOnce(mockTaskRow);

      const result = await service.deleteTask("1", "user-1");

      expect(mockTasksRepository.softDelete).toHaveBeenCalledWith("1", "user-1");
      expect(result).toEqual(mockTaskRow);
    });
  });

  describe("getStats", () => {
    it("should fetch stats from the repository", async () => {
      const mockStats = {
        total: 10,
        active: 5,
        archived: 3,
        deleted: 2,
        todo: 2,
        inProgress: 1,
        review: 1,
        done: 1,
        backlog: 0,
        canceled: 0,
      };
      mockTasksRepository.stats.mockResolvedValueOnce(mockStats);

      const result = await service.getStats("user-1");

      expect(mockTasksRepository.stats).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(mockStats);
    });
  });

  describe("getMonthlyCounts", () => {
    it("should fetch monthly counts from the repository", async () => {
      const mockData = [
        { month: 1, created: 5, completed: 3, archived: 1 },
        { month: 2, created: 10, completed: 7, archived: 2 },
      ];
      mockTasksRepository.getMonthlyCounts.mockResolvedValueOnce(mockData);

      const result = await service.getMonthlyCounts("user-1", 2026);

      expect(mockTasksRepository.getMonthlyCounts).toHaveBeenCalledWith("user-1", 2026);
      expect(result).toEqual(mockData);
    });
  });
});