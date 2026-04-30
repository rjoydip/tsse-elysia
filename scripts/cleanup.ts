#!/usr/bin/env bun

/**
 * Cleanup Script
 *
 * This script removes unnecessary files and artifacts from the project.
 * Use this to clean up after development, testing, or to start fresh.
 *
 * What it cleans up:
 * 1. Test artifacts (playwright-report, test-results)
 * 2. Build output (dist, .output)
 * 3. Development artifacts (.tanstack)
 * 4. Database files (.artifacts)
 * 5. Coverage reports
 * 6. Log files
 *
 * Usage:
 *   bun run scripts/cleanup.ts
 *
 * Options:
 *   --full       Remove node_modules as well (full reset)
 *   --keep-db    Keep database files
 *   --dry-run    Show what would be deleted without deleting
 */

import { existsSync, rmSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { scriptLogger as logger } from "../src/lib/logger";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const FULL_RESET = process.argv.includes("--full");
const KEEP_DB = process.argv.includes("--keep-db");
const DRY_RUN = process.argv.includes("--dry-run");

type DirToClean = {
  path: string;
  name: string;
  preservePatterns?: string[];
};

const dirsToClean: DirToClean[] = [
  { path: join(rootDir, "playwright-report"), name: "Playwright report" },
  { path: join(rootDir, "test-results"), name: "Test results" },
  { path: join(rootDir, "dist"), name: "Build output (dist)" },
  { path: join(rootDir, ".tanstack"), name: "TanStack dev artifacts" },
  { path: join(rootDir, "coverage"), name: "Coverage reports" },
  { path: join(rootDir, ".fallow"), name: "Fallow Cache" },
];

if (!KEEP_DB) {
  dirsToClean.push({
    path: join(rootDir, ".artifacts"),
    name: "Database files",
    preservePatterns: ["*.exe", "*.EXE"], // Preserve executable files like k9.exe
  });
}

if (FULL_RESET) {
  dirsToClean.push({
    path: join(rootDir, "node_modules"),
    name: "Node modules",
  });
}

logger.section("TSS Elysia Cleanup");
logger.info(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : FULL_RESET ? "FULL RESET" : "Standard"}`);

if (KEEP_DB) {
  logger.warn("Database files will be preserved");
}

let totalSize = 0;
let deletedCount = 0;

for (const dir of dirsToClean) {
  if (!existsSync(dir.path)) {
    logger.info(`○ ${dir.name}: already clean`);
    continue;
  }

  const preservePatterns = dir.preservePatterns || [];
  const size = getDirSize(dir.path, preservePatterns);
  totalSize += size;

  if (DRY_RUN) {
    logger.warn(`⚠ ${dir.name}: would delete (${formatSize(size)})`);
  } else {
    try {
      // If there are preserve patterns, handle selectively
      if (preservePatterns.length > 0) {
        await cleanDirPreserving(dir.path, preservePatterns);
        logger.success(`✓ ${dir.name}: cleaned (preserved ${preservePatterns.join(", ")})`);
      } else {
        rmSync(dir.path, { recursive: true, force: true });
        logger.success(`✓ ${dir.name}: removed (${formatSize(size)})`);
      }
      deletedCount++;
    } catch (err) {
      logger.error(`✗ ${dir.name}: failed to remove - ${err}`);
    }
  }
}

logger.info("=".repeat(40));

if (DRY_RUN) {
  logger.info(`📊 Total to delete: ${formatSize(totalSize)}`);
  logger.info("Run without --dry-run to actually delete files.");
} else {
  logger.info(`📊 Total cleaned: ${formatSize(totalSize)}`);
  logger.info(`🗂️  Directories removed: ${deletedCount}`);

  if (FULL_RESET) {
    logger.warn("Full reset complete. Run 'bun install' to reinstall dependencies.");
  } else {
    logger.info("Next steps:");
    logger.list("Run 'bun run dev' to start fresh");
    logger.list("Run 'bun run scripts/setup.ts' for full setup");
  }
}

/**
 * Gets directory size excluding files that match preserve patterns.
 */
function getDirSize(dirPath: string, preservePatterns: string[] = []): number {
  let size = 0;
  try {
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        size += getDirSize(fullPath, preservePatterns);
      } else if (!matchesAnyPattern(entry, preservePatterns)) {
        size += stat.size;
      }
    }
  } catch {
    // Ignore errors
  }
  return size;
}

/**
 * Cleans directory but preserves files matching patterns.
 */
async function cleanDirPreserving(dirPath: string, preservePatterns: string[]): Promise<void> {
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      await cleanDirPreserving(fullPath, preservePatterns);
      // Remove empty directories
      try {
        const remaining = readdirSync(fullPath);
        if (remaining.length === 0) {
          rmSync(fullPath, { recursive: true, force: true });
        }
      } catch {
        // Ignore
      }
    } else if (!matchesAnyPattern(entry, preservePatterns)) {
      // Delete files that don't match preserve patterns
      rmSync(fullPath, { force: true });
    }
  }
}

/**
 * Checks if a filename matches any of the given patterns.
 */
function matchesAnyPattern(filename: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Simple glob matching for *.ext patterns
    if (pattern.startsWith("*.")) {
      const ext = pattern.slice(1);
      return filename.toLowerCase().endsWith(ext.toLowerCase());
    }
    return filename === pattern;
  });
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}