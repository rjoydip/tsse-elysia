import { readFileSync, existsSync } from "fs";

const FILE = "knowledge/TASKS.md";

if (!existsSync(FILE)) {
  console.error(`❌ ${FILE} not found`);
  process.exit(1);
}

const content = readFileSync(FILE, "utf-8");

if (!content.trim()) {
  console.warn("⚠️ TASKS.md is empty");
  process.exit(0);
}

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