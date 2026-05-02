#!/usr/bin/env bun

/**
 * Release Script
 *
 * Manual release process for when GitHub Actions is not available.
 * This script handles versioning, tagging, and GitHub release creation.
 *
 * Usage:
 *   bun run scripts/release.ts              # Full release
 *   bun run scripts/release.ts --dry-run   # Preview changes
 *   bun run scripts/release.ts --skip-tests  # Skip validation
 *   bun run scripts/release.ts --skip-tag    # Skip git tagging
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { scriptLogger as logger } from "../src/lib/logger";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_TESTS = process.argv.includes("--skip-tests");
const SKIP_TAG = process.argv.includes("--skip-tag");
const SKIP_PUSH = process.argv.includes("--skip-push");

/**
 * Executes a shell command and returns the exit code.
 */
async function exec(command: string, args: string[], options?: { cwd?: string }): Promise<number> {
  const proc = Bun.spawn([command, ...args], {
    cwd: options?.cwd ?? rootDir,
  });
  await proc.exited;
  return proc.exitCode ?? -1;
}

/**
 * Gets current version from package.json.
 */
function getCurrentVersion(): string {
  const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));
  return packageJson.version;
}

/**
 * Checks if there are commits to release.
 */
async function hasChanges(): Promise<boolean> {
  const tagProc = Bun.spawn(["git", "describe", "--tags", "--abbrev=0"], {
    cwd: rootDir,
  });
  await tagProc.exited;
  const hasTag = tagProc.exitCode === 0;

  if (!hasTag) {
    const logProc = Bun.spawn(["git", "log", "--oneline", "-1"], {
      cwd: rootDir,
    });
    await logProc.exited;
    return logProc.exitCode === 0;
  }

  // Get last tag
  const tagOutput = await new Response(tagProc.stdout).text();
  const lastTag = tagOutput.trim();
  if (!lastTag) return false;

  // Check commits since last tag
  const logProc = Bun.spawn(["git", "log", "--oneline", `${lastTag}..HEAD`], {
    cwd: rootDir,
  });
  await logProc.exited;
  const logOutput = await new Response(logProc.stdout).text();
  return logOutput.trim().length > 0;
}

/**
 * Validates the working tree is clean.
 */
async function validateWorkingTree(): Promise<boolean> {
  logger.step(1, "Validating working tree...");
  const code = await exec("git", ["status", "--porcelain"]);
  if (code !== 0) {
    logger.error("Working tree is not clean. Please commit or stash changes.");
    return false;
  }
  logger.success("Working tree is clean");
  return true;
}

/**
 * Runs quality checks.
 */
async function runQualityChecks(): Promise<boolean> {
  if (SKIP_TESTS) {
    logger.info("Skipping quality checks (--skip-tests)");
    return true;
  }

  logger.step(2, "Running quality checks...");

  logger.info("Running linters...");
  let code = await exec("bun", ["run", "lint:check"]);
  if (code !== 0) {
    logger.error("Linting failed");
    return false;
  }

  logger.info("Running typecheck...");
  code = await exec("bun", ["run", "typecheck"]);
  if (code !== 0) {
    logger.error("Typecheck failed");
    return false;
  }

  logger.info("Running tests...");
  code = await exec("bun", ["test"]);
  if (code !== 0) {
    logger.error("Tests failed");
    return false;
  }

  logger.success("All quality checks passed");
  return true;
}

/**
 * Runs build.
 */
async function runBuild(): Promise<boolean> {
  logger.step(3, "Building application...");

  const code = await exec("bun", ["run", "build"]);
  if (code !== 0) {
    logger.error("Build failed");
    return false;
  }

  logger.success("Build successful");
  return true;
}

/**
 * Creates version bump with changelogen.
 */
async function versionBump(): Promise<string | null> {
  logger.step(4, "Running version bump with changelogen...");

  const args = DRY_RUN ? ["--bump", "--dry-run"] : ["--bump"];
  const code = await exec("bun", ["changelogen", ...args]);
  if (code !== 0) {
    logger.error("Version bump failed");
    return null;
  }

  const newVersion = getCurrentVersion();
  logger.success(`Version bumped to ${newVersion}`);
  return newVersion;
}

/**
 * Creates git tag.
 */
async function createTag(version: string): Promise<boolean> {
  if (SKIP_TAG) {
    logger.info("Skipping tag creation (--skip-tag)");
    return true;
  }

  logger.step(5, "Creating git tag...");

  let code = await exec("git", ["add", "."]);
  if (code !== 0) return false;

  code = await exec("git", ["commit", "-m", `chore: release v${version}`]);
  if (code !== 0) return false;

  code = await exec("git", ["tag", "-a", `v${version}`, "-m", `Release v${version}`]);
  if (code !== 0) return false;

  logger.success(`Created tag v${version}`);

  if (!SKIP_PUSH && !DRY_RUN) {
    logger.info("Pushing to remote...");
    code = await exec("git", ["push", "origin", `v${version}`]);
    if (code !== 0) return false;
    logger.success("Tag pushed to remote");
  }

  return true;
}

/**
 * Creates GitHub release using changelogithub.
 */
async function createGitHubRelease(): Promise<boolean> {
  logger.step(6, "Creating GitHub release...");

  if (DRY_RUN) {
    logger.info("[DRY RUN] Would create GitHub release with changelogithub");
    return true;
  }

  const code = await exec("bun", ["changelogen", "gh", "release"]);

  if (code !== 0) {
    logger.error("GitHub release creation failed");
    return false;
  }

  logger.success("GitHub release created");
  return true;
}

// =============================================================================
// Main Release Process
// =============================================================================

logger.section("TSS Elysia Release Process");

if (DRY_RUN) {
  logger.warn("DRY RUN MODE - No changes will be made\n");
}

const currentVersion = getCurrentVersion();
logger.info(`Current version: ${currentVersion}`);
logger.info(`Has changes: ${(await hasChanges()) ? "Yes" : "No"}`);

if (!(await hasChanges())) {
  logger.error("No changes found. Nothing to release.");
  logger.info("Make conventional commits (feat:, fix:, etc.) to create a release.\n");
  process.exit(1);
}

// Validation
if (!DRY_RUN && !(await validateWorkingTree())) {
  process.exit(1);
}

// Quality checks
if (!(await runQualityChecks())) {
  process.exit(1);
}

// Build
if (!(await runBuild())) {
  process.exit(1);
}

// Version bump
const newVersion = await versionBump();
if (!newVersion) {
  process.exit(1);
}

// Create tag
if (!(await createTag(newVersion))) {
  process.exit(1);
}

// Create GitHub release
if (!(await createGitHubRelease())) {
  process.exit(1);
}

// Summary
logger.section("Release Complete!");
logger.success(`Version: ${newVersion}`);
logger.info(`Tag: ${SKIP_TAG ? "[skipped]" : `v${newVersion}`}`);
logger.success(DRY_RUN ? "[dry-run]" : "Release created");