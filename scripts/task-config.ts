/**
 * Configuration for task synchronization between TASKS.md and GitHub Issues.
 * Frozen to prevent accidental mutations at runtime.
 *
 * @property tasksFile - Path to the TASKS.md file
 * @property issueLabels - Labels to apply to auto-created issues
 * @property issueProject - Optional project board to assign issues to
 * @property logMissingOnly - Whether to only log missing issues (vs creating them)
 */

export const taskConfig = Object.freeze({
  tasksFile: "knowledge/TASKS.md",
  issueLabels: Object.freeze(["auto-created"]),
  issueProject: null,
  logMissingOnly: true,
});

/**
 * Type definition for task configuration options.
 */

export interface TaskConfig {
  tasksFile: string;
  issueLabels: string[];
  issueProject: string | null;
  logMissingOnly: boolean;
}