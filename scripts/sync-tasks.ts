import { readFileSync } from "fs";

const FILE = "knowledge/TASKS.md";

const content = readFileSync(FILE, "utf-8");

const lines = content.split("\n");

const tasks = lines.filter((l) => l.includes("- [ ]"));

for (const task of tasks) {
  if (!task.includes("issue:")) continue;

  const hasIssue = /issue:\s*\d+/.test(task);

  if (!hasIssue) {
    console.log("Need to create issue:", task);
    // handled by GitHub Action using gh CLI
  }
}