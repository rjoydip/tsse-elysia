export const taskConfig = {
  tasksFile: "knowledge/TASKS.md" as string,
  issueLabels: ["auto-created"] as string[],
  issueProject: null as string | null,
  logMissingOnly: true as boolean,
};

export interface TaskConfig {
  tasksFile: string;
  issueLabels: string[];
  issueProject: string | null;
  logMissingOnly: boolean;
}