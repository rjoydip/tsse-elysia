/**
 * Unit tests for TasksRepository stats and getMonthlyCounts.
 * Uses constructor injection to provide a mock db and the real tasks table schema
 * so that drizzle-orm functions (eq, and, etc.) receive real column objects
 * without mocking module-level imports that may affect other test files.
 */

import { describe, it, expect, vi, beforeEach } from "bun:test";
import { TasksRepository } from "~/repositories/tasks/tasks.repository";
import { tasks } from "~/lib/db/schema/tasks";
import type { TaskStats, MonthlyTaskCount } from "~/repositories/tasks/tasks.repository";

/**
 * Helper: builds a chainable mock that returns data from groupBy.
 */
function chainWithGroupBy(data: unknown[]) {
  return {
    from: () => ({
      where: () => ({
        groupBy: () => Promise.resolve(data),
      }),
    }),
  };
}

/**
 * Helper: returns a select mock that returns different chain results for each call.
 */
function selectMockForQueries(results: unknown[][]) {
  const chains = results.map((data) => chainWithGroupBy(data));
  const mock = vi.fn();
  chains.forEach((c) => mock.mockReturnValueOnce(c));
  return mock;
}

describe("TasksRepository", () => {
  let repository: TasksRepository;
  let mockDb: { select: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = { select: vi.fn() };
    // Inject mock db + real tasks schema so eq(tasks.col) works
    repository = new TasksRepository(mockDb as any, tasks);
  });

  // ---------------------------------------------------------------------------
  // stats() – aggregate task counts grouped by status / archivedAt / deletedAt
  // ---------------------------------------------------------------------------
  describe("stats", () => {
    const emptyStats: TaskStats = {
      total: 0,
      active: 0,
      archived: 0,
      deleted: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      backlog: 0,
      canceled: 0,
    };

    it("should return all zeros when no tasks exist", async () => {
      mockDb.select.mockReturnValue(chainWithGroupBy([]));
      expect(await repository.stats("user-1")).toEqual(emptyStats);
    });

    it("should count active tasks with correct status breakdown", async () => {
      mockDb.select.mockReturnValue(
        chainWithGroupBy([
          { status: "todo", archivedAt: null, deletedAt: null, count: 2 },
          { status: "in progress", archivedAt: null, deletedAt: null, count: 1 },
          { status: "in-progress", archivedAt: null, deletedAt: null, count: 3 },
          { status: "review", archivedAt: null, deletedAt: null, count: 4 },
          { status: "done", archivedAt: null, deletedAt: null, count: 5 },
          { status: "backlog", archivedAt: null, deletedAt: null, count: 1 },
          { status: "canceled", archivedAt: null, deletedAt: null, count: 2 },
        ]),
      );

      const result = await repository.stats("user-1");

      expect(result.total).toBe(18);
      expect(result.active).toBe(18);
      expect(result.archived).toBe(0);
      expect(result.deleted).toBe(0);
      expect(result.todo).toBe(2);
      expect(result.inProgress).toBe(4); // "in progress" + "in-progress"
      expect(result.review).toBe(4);
      expect(result.done).toBe(5);
      expect(result.backlog).toBe(1);
      expect(result.canceled).toBe(2);
    });

    it("should bill both 'in progress' and 'in-progress' under inProgress", async () => {
      mockDb.select.mockReturnValue(
        chainWithGroupBy([
          { status: "in progress", archivedAt: null, deletedAt: null, count: 2 },
          { status: "in-progress", archivedAt: null, deletedAt: null, count: 3 },
        ]),
      );

      const result = await repository.stats("user-1");

      expect(result.inProgress).toBe(5);
      expect(result.active).toBe(5);
      expect(result.total).toBe(5);
    });

    it("should count archived tasks separately and exclude from status counts", async () => {
      mockDb.select.mockReturnValue(
        chainWithGroupBy([
          { status: "todo", archivedAt: 1_700_000_000, deletedAt: null, count: 3 },
          { status: "done", archivedAt: 1_700_000_100, deletedAt: null, count: 2 },
        ]),
      );

      const result = await repository.stats("user-1");

      expect(result.total).toBe(5);
      expect(result.active).toBe(0);
      expect(result.archived).toBe(5);
      expect(result.todo).toBe(0);
      expect(result.done).toBe(0);
    });

    it("should count deleted tasks separately and exclude from status and active", async () => {
      mockDb.select.mockReturnValue(
        chainWithGroupBy([
          { status: "done", archivedAt: null, deletedAt: 1_700_000_000, count: 4 },
        ]),
      );

      const result = await repository.stats("user-1");

      expect(result.total).toBe(4);
      expect(result.active).toBe(0);
      expect(result.deleted).toBe(4);
      expect(result.done).toBe(0);
    });

    it("should handle mixed active + archived + deleted state correctly", async () => {
      mockDb.select.mockReturnValue(
        chainWithGroupBy([
          { status: "todo", archivedAt: null, deletedAt: null, count: 5 }, // active
          { status: "done", archivedAt: null, deletedAt: null, count: 3 }, // active
          { status: "review", archivedAt: 1_700_000_000, deletedAt: null, count: 2 }, // archived
          { status: "todo", archivedAt: null, deletedAt: 1_700_000_000, count: 1 }, // deleted
        ]),
      );

      const result = await repository.stats("user-1");

      expect(result.total).toBe(11);
      expect(result.active).toBe(8);
      expect(result.archived).toBe(2);
      expect(result.deleted).toBe(1);
      expect(result.todo).toBe(5);
      expect(result.done).toBe(3);
      expect(result.review).toBe(0);
    });

    it("should handle large counts", async () => {
      mockDb.select.mockReturnValue(
        chainWithGroupBy([{ status: "done", archivedAt: null, deletedAt: null, count: 1_000_000 }]),
      );

      const result = await repository.stats("user-1");

      expect(result.total).toBe(1_000_000);
      expect(result.done).toBe(1_000_000);
    });

    it("should ignore unknown statuses (not in status switch)", async () => {
      mockDb.select.mockReturnValue(
        chainWithGroupBy([{ status: "unknown", archivedAt: null, deletedAt: null, count: 3 }]),
      );

      const result = await repository.stats("user-1");

      expect(result.total).toBe(3);
      expect(result.active).toBe(3);
      expect(result.todo).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.review).toBe(0);
      expect(result.done).toBe(0);
      expect(result.backlog).toBe(0);
      expect(result.canceled).toBe(0);
    });

    it("should aggregate multiple rows with the same status under one count", async () => {
      // GroupBy may produce separate rows if archivedAt/deletedAt differ
      mockDb.select.mockReturnValue(
        chainWithGroupBy([
          { status: "todo", archivedAt: null, deletedAt: null, count: 2 },
          { status: "todo", archivedAt: null, deletedAt: 1_700_000_000, count: 1 },
        ]),
      );

      const result = await repository.stats("user-1");

      expect(result.total).toBe(3);
      expect(result.active).toBe(2);
      expect(result.deleted).toBe(1);
      expect(result.todo).toBe(2); // only active todos
    });
  });

  // ---------------------------------------------------------------------------
  // getMonthlyCounts – created / completed / archived per month for a given year
  // ---------------------------------------------------------------------------
  describe("getMonthlyCounts", () => {
    /**
     * Builds a 12-month expectation by filling default zeros and merging overrides.
     */
    function expectMonths(
      overrides: Array<{ month: number; created?: number; completed?: number; archived?: number }>,
    ): MonthlyTaskCount[] {
      const base = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        created: 0,
        completed: 0,
        archived: 0,
      }));
      for (const o of overrides) {
        const idx = o.month - 1;
        if (o.created !== undefined) base[idx].created = o.created;
        if (o.completed !== undefined) base[idx].completed = o.completed;
        if (o.archived !== undefined) base[idx].archived = o.archived;
      }
      return base;
    }

    it("should return 12 months of zeros when no tasks exist for the year", async () => {
      mockDb.select = selectMockForQueries([[], [], []]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result).toHaveLength(12);
      expect(result).toEqual(expectMonths([]));
    });

    it("should distribute created counts across months", async () => {
      mockDb.select = selectMockForQueries([
        [
          { month: 1, count: 5 },
          { month: 3, count: 7 },
          { month: 12, count: 2 },
        ],
        [],
        [],
      ]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result).toEqual(
        expectMonths([
          { month: 1, created: 5 },
          { month: 3, created: 7 },
          { month: 12, created: 2 },
        ]),
      );
    });

    it("should distribute completed counts across months", async () => {
      mockDb.select = selectMockForQueries([
        [],
        [
          { month: 2, count: 3 },
          { month: 6, count: 10 },
        ],
        [],
      ]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result).toEqual(
        expectMonths([
          { month: 2, completed: 3 },
          { month: 6, completed: 10 },
        ]),
      );
    });

    it("should distribute archived counts across months", async () => {
      mockDb.select = selectMockForQueries([
        [],
        [],
        [
          { month: 4, count: 1 },
          { month: 11, count: 4 },
        ],
      ]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result).toEqual(
        expectMonths([
          { month: 4, archived: 1 },
          { month: 11, archived: 4 },
        ]),
      );
    });

    it("should combine created, completed, and archived for the same month", async () => {
      mockDb.select = selectMockForQueries([
        [{ month: 6, count: 10 }],
        [{ month: 6, count: 4 }],
        [{ month: 6, count: 2 }],
      ]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result[5]).toEqual({ month: 6, created: 10, completed: 4, archived: 2 });
    });

    it("should return all three counts in different months correctly", async () => {
      mockDb.select = selectMockForQueries([
        [{ month: 1, count: 8 }],
        [{ month: 6, count: 3 }],
        [{ month: 12, count: 5 }],
      ]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result).toEqual(
        expectMonths([
          { month: 1, created: 8 },
          { month: 6, completed: 3 },
          { month: 12, archived: 5 },
        ]),
      );
    });

    it("should fill gaps with zero when no data for a given month", async () => {
      mockDb.select = selectMockForQueries([
        [{ month: 7, count: 4 }],
        [],
        [{ month: 12, count: 1 }],
      ]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      for (let m = 1; m <= 6; m++) {
        expect(result[m - 1]).toEqual({ month: m, created: 0, completed: 0, archived: 0 });
      }
      expect(result[6]).toEqual({ month: 7, created: 4, completed: 0, archived: 0 });
      for (let m = 8; m <= 11; m++) {
        expect(result[m - 1]).toEqual({ month: m, created: 0, completed: 0, archived: 0 });
      }
      expect(result[11]).toEqual({ month: 12, created: 0, completed: 0, archived: 1 });
    });

    it("should handle all months having data", async () => {
      const created = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: i + 1 }));
      const completed = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: (i + 1) * 2,
      }));
      const archived = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: (i + 1) * 3 }));

      mockDb.select = selectMockForQueries([created, completed, archived]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      for (let m = 1; m <= 12; m++) {
        expect(result[m - 1]).toEqual({
          month: m,
          created: m,
          completed: m * 2,
          archived: m * 3,
        });
      }
    });

    it("should handle multiple rows for the same month in same category", async () => {
      mockDb.select = selectMockForQueries([
        [{ month: 3, count: 15 }],
        [{ month: 3, count: 6 }],
        [],
      ]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result[2]).toEqual({ month: 3, created: 15, completed: 6, archived: 0 });
    });

    it("should ensure the returned array is always exactly 12 months", async () => {
      mockDb.select = selectMockForQueries([[{ month: 6, count: 1 }], [], []]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result).toHaveLength(12);
      expect(result[0].month).toBe(1);
      expect(result[11].month).toBe(12);
    });

    it("should ignore tasks outside the requested year", async () => {
      mockDb.select = selectMockForQueries([[], [], []]);

      const result = await repository.getMonthlyCounts("user-1", 2026);

      expect(result.every((m) => m.created === 0 && m.completed === 0 && m.archived === 0)).toBe(
        true,
      );
    });

    it("should work for past and future years", async () => {
      mockDb.select = selectMockForQueries([[{ month: 12, count: 1 }], [], []]);

      const result2020 = await repository.getMonthlyCounts("user-1", 2020);
      expect(result2020[11].created).toBe(1);

      mockDb.select = selectMockForQueries([[{ month: 1, count: 1 }], [], []]);

      const result2030 = await repository.getMonthlyCounts("user-1", 2030);
      expect(result2030[0].created).toBe(1);
    });
  });
});