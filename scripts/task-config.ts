export const taskConfig = Object.freeze({
  tasksFile: "knowledge/TASKS.md",
  issueLabels: Object.freeze(["auto-created"]),
  issueProject: null,
  logMissingOnly: true,
});

export interface TaskConfig {
  tasksFile: string;
  issueLabels: string[];
  issueProject: string | null;
  logMissingOnly: boolean;
}