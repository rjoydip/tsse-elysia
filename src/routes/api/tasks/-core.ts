/**
 * Tasks API routes.
 * Layered architecture: HTTP -> Controller -> Service -> Repository.
 * Provides CRUD, archive, soft-delete, stats, and monthly chart data endpoints.
 */

import { Elysia, t } from "elysia";
import { logger } from "~/lib/logger";
import { tasksService } from "~/services/tasks/tasks.service";
import { validateSession, validateCreateTaskRequest } from "~/controllers/tasks/controller";

export const tasksRoutes = new Elysia({
  name: "api.routes.tasks",
  prefix: "/tasks",
})
  /**
   * GET /api/tasks - List tasks with optional filters.
   */
  .get(
    "/",
    async ({ set, request, query }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      try {
        const status = query.status
          ? Array.isArray(query.status)
            ? query.status
            : [query.status]
          : undefined;
        const priority = query.priority
          ? Array.isArray(query.priority)
            ? query.priority
            : [query.priority]
          : undefined;
        const page = query.page ? Number(query.page) : 1;
        const pageSize = query.pageSize ? Number(query.pageSize) : 50;

        const result = await tasksService.listTasks(session.userId, {
          status,
          priority,
          search: query.search,
          includeArchived: query.includeArchived === "true",
          includeDeleted: query.includeDeleted === "true",
          page,
          pageSize,
        });

        return {
          tasks: result.tasks,
          total: result.total,
          page,
          pageSize,
        };
      } catch (err) {
        logger.error("Failed to list tasks:", err instanceof Error ? err : new Error(String(err)));
        set.status = 500;
        return { error: "Failed to list tasks" };
      }
    },
    {
      query: t.Object({
        status: t.Optional(t.Union([t.String(), t.Array(t.String())])),
        priority: t.Optional(t.Union([t.String(), t.Array(t.String())])),
        search: t.Optional(t.String()),
        includeArchived: t.Optional(t.String()),
        includeDeleted: t.Optional(t.String()),
        page: t.Optional(t.String()),
        pageSize: t.Optional(t.String()),
      }),
      detail: {
        summary: "List tasks",
        description: "List tasks for the authenticated user with optional filtering.",
        tags: ["tasks"],
        responses: {
          200: { description: "List of tasks" },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  )

  /**
   * GET /api/tasks/stats - Aggregate task stats for dashboard.
   */
  .get(
    "/stats",
    async ({ set, request }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      try {
        const stats = await tasksService.getStats(session.userId);
        return stats;
      } catch (err) {
        logger.error(
          "Failed to get task stats:",
          err instanceof Error ? err : new Error(String(err)),
        );
        set.status = 500;
        return { error: "Failed to get task stats" };
      }
    },
    {
      detail: {
        summary: "Get task stats",
        description: "Returns aggregate task statistics for the dashboard overview.",
        tags: ["tasks"],
        responses: {
          200: { description: "Task stats" },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  )

  /**
   * GET /api/tasks/monthly - Monthly task counts for line chart.
   */
  .get(
    "/monthly",
    async ({ set, request, query }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      try {
        const year = query.year ? Number(query.year) : new Date().getFullYear();
        const data = await tasksService.getMonthlyCounts(session.userId, year);
        return { year, data };
      } catch (err) {
        logger.error(
          "Failed to get monthly task counts:",
          err instanceof Error ? err : new Error(String(err)),
        );
        set.status = 500;
        return { error: "Failed to get monthly task counts" };
      }
    },
    {
      query: t.Object({
        year: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get monthly task counts",
        description: "Returns monthly created/completed/archived task counts for the chart.",
        tags: ["tasks"],
        responses: {
          200: { description: "Monthly task data" },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  )

  /**
   * GET /api/tasks/:id - Get a single task.
   */
  .get(
    "/:id",
    async ({ set, request, params }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      try {
        const task = await tasksService.getTask(params.id, session.userId);
        if (!task) {
          set.status = 404;
          return { error: "Task not found" };
        }
        return task;
      } catch (err) {
        logger.error("Failed to get task:", err instanceof Error ? err : new Error(String(err)));
        set.status = 500;
        return { error: "Failed to get task" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Get task",
        description: "Get a single task by ID.",
        tags: ["tasks"],
        responses: {
          200: { description: "Task data" },
          401: { description: "Unauthorized" },
          404: { description: "Task not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  )

  /**
   * POST /api/tasks - Create a new task.
   */
  .post(
    "/",
    async ({ set, request, body }) => {
      const { error: authError, session } = await validateSession(request, set);
      if (authError) return authError;

      const { error: validationError, data } = await validateCreateTaskRequest(
        body as Record<string, unknown>,
      );
      if (validationError) return validationError;
      if (!data) return new Response("Invalid request data", { status: 400 });

      try {
        const task = await tasksService.createTask({
          ...data,
          userId: session.userId,
        });
        return task;
      } catch (err) {
        logger.error("Failed to create task:", err instanceof Error ? err : new Error(String(err)));
        set.status = 500;
        return { error: "Failed to create task" };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        description: t.Optional(t.String()),
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        label: t.Optional(t.String()),
        dueDate: t.Optional(t.String()),
        assignee: t.Optional(t.String()),
      }),
      detail: {
        summary: "Create task",
        description: "Create a new task for the authenticated user.",
        tags: ["tasks"],
        responses: {
          200: { description: "Task created" },
          400: { description: "Invalid request body" },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  )

  /**
   * PATCH /api/tasks/:id - Update a task.
   */
  .patch(
    "/:id",
    async ({ set, request, params, body }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      try {
        const task = await tasksService.updateTask(params.id, session.userId, body);
        if (!task) {
          set.status = 404;
          return { error: "Task not found" };
        }
        return task;
      } catch (err) {
        logger.error("Failed to update task:", err instanceof Error ? err : new Error(String(err)));
        set.status = 500;
        return { error: "Failed to update task" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        label: t.Optional(t.String()),
        dueDate: t.Optional(t.Nullable(t.String())),
        assignee: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        summary: "Update task",
        description: "Update an existing task by ID.",
        tags: ["tasks"],
        responses: {
          200: { description: "Task updated" },
          401: { description: "Unauthorized" },
          404: { description: "Task not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  )

  /**
   * POST /api/tasks/:id/archive - Archive a task.
   */
  .post(
    "/:id/archive",
    async ({ set, request, params }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      try {
        const task = await tasksService.archiveTask(params.id, session.userId);
        if (!task) {
          set.status = 404;
          return { error: "Task not found" };
        }
        return task;
      } catch (err) {
        logger.error(
          "Failed to archive task:",
          err instanceof Error ? err : new Error(String(err)),
        );
        set.status = 500;
        return { error: "Failed to archive task" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Archive task",
        description: "Archive a task by ID.",
        tags: ["tasks"],
        responses: {
          200: { description: "Task archived" },
          401: { description: "Unauthorized" },
          404: { description: "Task not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  )

  /**
   * POST /api/tasks/:id/unarchive - Unarchive a task.
   */
  .post(
    "/:id/unarchive",
    async ({ set, request, params }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      try {
        const task = await tasksService.unarchiveTask(params.id, session.userId);
        if (!task) {
          set.status = 404;
          return { error: "Task not found" };
        }
        return task;
      } catch (err) {
        logger.error(
          "Failed to unarchive task:",
          err instanceof Error ? err : new Error(String(err)),
        );
        set.status = 500;
        return { error: "Failed to unarchive task" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Unarchive task",
        description: "Unarchive a task by ID.",
        tags: ["tasks"],
        responses: {
          200: { description: "Task unarchived" },
          401: { description: "Unauthorized" },
          404: { description: "Task not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  )

  /**
   * DELETE /api/tasks/:id - Soft-delete a task.
   */
  .delete(
    "/:id",
    async ({ set, request, params }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      try {
        const task = await tasksService.deleteTask(params.id, session.userId);
        if (!task) {
          set.status = 404;
          return { error: "Task not found" };
        }
        return { success: true, task: task };
      } catch (err) {
        logger.error("Failed to delete task:", err instanceof Error ? err : new Error(String(err)));
        set.status = 500;
        return { error: "Failed to delete task" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Delete task",
        description: "Soft-delete a task by ID.",
        tags: ["tasks"],
        responses: {
          200: { description: "Task deleted" },
          401: { description: "Unauthorized" },
          404: { description: "Task not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  );