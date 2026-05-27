#!/usr/bin/env bun

import { exec } from "child_process";
import { promisify } from "util";
import { scriptLogger as logger } from "~/lib/logger";

const execAsync = promisify(exec);

async function getSessionIds(): Promise<string[]> {
  try {
    const { stdout } = await execAsync("opencode session list");

    return stdout
      .split("\n")
      .map((line) => line.trim().split(/\s+/)[0])
      .filter((id) => id.startsWith("ses_"));
  } catch (error) {
    logger.error(`Failed to fetch session list: ${error}`);
    process.exit(1);
  }
}

async function deleteSession(sessionId: string) {
  try {
    logger.info(`Deleting ${sessionId}...`);
    await execAsync(`opencode session delete ${sessionId}`);
    logger.success(`Deleted ${sessionId}`);
  } catch (error) {
    logger.error(`Failed to delete ${sessionId}: ${error}`);
  }
}

async function main() {
  logger.info("Fetching sessions...");
  const sessions = await getSessionIds();

  if (!sessions || sessions.length === 0) {
    logger.info("No sessions found.");
    return;
  }

  logger.info(`Found ${sessions.length} sessions.`);

  // 🔥 Run all deletions in parallel
  await Promise.all(sessions.map((session) => deleteSession(session)));

  logger.success("All done.");
}

main();