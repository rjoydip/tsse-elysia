/**
 * Tasks service.
 * Encapsulates business logic for task management operations.
 */

import {
  tasksRepository,
  type ITasksRepository,
  type TaskRow,
  type TaskFilters,
  type TaskStats,
  type MonthlyTaskCount,
} from "~/repositories/tasks/tasks.repository";

/**
 * Tasks service interface.
 */
export interface ITasksService {
  listTasks(userId: string, filters?: TaskFilters): Promise<{ tasks: TaskRow[]; total: number }>;
  getTask(id: string, userId: string): Promise<TaskRow | null>;
  createTask(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    label?: string;
    dueDate?: string;
    userId: string;
    assignee?: string;
  }): Promise<TaskRow>;
  updateTask(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      label: string;
      dueDate: string;
      assignee: string;
    }>,
  ): Promise<TaskRow | null>;
  archiveTask(id: string, userId: string): Promise<TaskRow | null>;
  unarchiveTask(id: string, userId: string): Promise<TaskRow | null>;
  deleteTask(id: string, userId: string): Promise<TaskRow | null>;
  getStats(userId: string): Promise<TaskStats>;
  getMonthlyCounts(userId: string, year: number): Promise<MonthlyTaskCount[]>;
}

/**
 * Tasks service implementation.
 */
export class TasksService implements ITasksService {
  private repository: ITasksRepository;

  constructor(repository: ITasksRepository = tasksRepository) {
    this.repository = repository;
  }

  /**
   * Lists tasks for a user with optional filtering and pagination.
   */
  async listTasks(
    userId: string,
    filters?: TaskFilters,
  ): Promise<{ tasks: TaskRow[]; total: number }> {
    return this.repository.findAll(userId, filters);
  }

  /**
   * Gets a single task with ownership check.
   */
  async getTask(id: string, userId: string): Promise<TaskRow | null> {
    return this.repository.findById(id, userId);
  }

  /**
   * Creates a new task for the user.
   */
  async createTask(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    label?: string;
    dueDate?: string;
    userId: string;
    assignee?: string;
  }): Promise<TaskRow> {
    return this.repository.create({
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      label: data.label,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      userId: data.userId,
      assignee: data.assignee,
    });
  }

  /**
   * Updates an existing task with ownership check.
   */
  async updateTask(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string | null;
      status: string;
      priority: string;
      label: string;
      dueDate: string | null;
      assignee: string | null;
    }>,
  ): Promise<TaskRow | null> {
    const updates: Partial<{
      title: string;
      description: string | null;
      status: string;
      priority: string;
      label: string;
      dueDate: number | null;
      assignee: string | null;
      createdAt: number;
      updatedAt: number;
      archivedAt: number | null;
      deletedAt: number | null;
    }> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.label !== undefined) updates.label = data.label;
    if (data.dueDate !== undefined)
      updates.dueDate =
        data.dueDate === null ? null : Math.floor(new Date(data.dueDate).getTime() / 1000);
    if (data.assignee !== undefined) updates.assignee = data.assignee;

    return this.repository.update(id, userId, updates);
  }

  /**
   * Archives a task.
   */
  async archiveTask(id: string, userId: string): Promise<TaskRow | null> {
    return this.repository.archive(id, userId);
  }

  /**
   * Unarchives a task.
   */
  async unarchiveTask(id: string, userId: string): Promise<TaskRow | null> {
    return this.repository.unarchive(id, userId);
  }

  /**
   * Soft-deletes a task.
   */
  async deleteTask(id: string, userId: string): Promise<TaskRow | null> {
    return this.repository.softDelete(id, userId);
  }

  /**
   * Returns aggregate task stats for the user.
   */
  async getStats(userId: string): Promise<TaskStats> {
    return this.repository.stats(userId);
  }

  /**
   * Returns monthly task counts for the chart.
   */
  async getMonthlyCounts(userId: string, year: number): Promise<MonthlyTaskCount[]> {
    return this.repository.getMonthlyCounts(userId, year);
  }
}

/**
 * Singleton instance of the tasks service.
 */
export const tasksService = new TasksService();