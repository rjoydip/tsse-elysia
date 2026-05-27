/**
 * Extracts tasks from TASKS.md that need GitHub issues created.
 * Guards against empty or missing files for robust execution.
 *
 * @example
 * bun scripts/sync-tasks.ts
 */

import { readFileSync, existsSync } from "fs";
import { logger } from "~/lib/logger";

const FILE = "knowledge/TASKS.md";

if (!existsSync(FILE)) {
  logger.error(`❌ ${FILE} not found`);
  process.exit(1);
}

const content = readFileSync(FILE, "utf-8");

if (!content.trim()) {
  logger.warn("⚠️ TASKS.md is empty");
  process.exit(0);
}

const lines = content.split("\n");

const tasks = lines.filter((l) => l.includes("- [ ]"));

for (const task of tasks) {
  if (!task.includes("issue:")) continue;

  const hasIssue = /issue:\s*\d+/.test(task);

  if (!hasIssue) {
    logger.log(`Need to create issue: ${task}`);
    // handled by GitHub Action using gh CLI
  }
}