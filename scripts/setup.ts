#!/usr/bin/env bun

/**
 * Setup Script
 *
 * This script sets up the project from scratch. Run this once after cloning
 * or when starting fresh.
 *
 * What it does:
 * 1. Checks for Bun runtime
 * 2. Installs dependencies
 * 3. Copies .env.example to .env (if .env doesn't exist)
 * 5. Generates database schema
 * 6. Runs database migrations
 * 7. Seeds the database with initial data
 * 8. Sets up git hooks
 * 9. Runs initial typecheck to verify setup
 *
 * Usage:
 *   bun run scripts/setup.ts
 *
 * To skip database setup:
 *   bun run scripts/setup.ts --skip-db
 */

import { existsSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { scriptLogger as logger } from "~/lib/logger";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const SKIP_DB = process.argv.includes("--skip-db");

logger.section("TSS Elysia Setup");

logger.step(1, "Checking Bun installation...");
try {
  const result = Bun.version;
  logger.success(`Bun ${result} detected`);
} catch {
  logger.error("Bun is not installed. Please install Bun first:");
  logger.command("https://bun.sh");
  process.exit(1);
}

logger.step(2, "Installing dependencies...");
const installProcess = Bun.spawn(["bun", "install"], {
  cwd: rootDir,
});
await installProcess.exited;
if (installProcess.exitCode !== 0) {
  logger.error("Failed to install dependencies");
  process.exit(1);
}
logger.success("Dependencies installed");

logger.step(3, "Setting up environment variables...");
const envExamplePath = join(rootDir, ".env.example");
const envPath = join(rootDir, ".env");

if (existsSync(envExamplePath)) {
  if (!existsSync(envPath)) {
    copyFileSync(envExamplePath, envPath);
    logger.success("Created .env from .env.example");
    logger.warn("Please edit .env and add your AUTH_SECRET!");
  } else {
    logger.info(".env already exists, skipping");
  }
} else {
  logger.info(".env.example not found, skipping");
}

if (!SKIP_DB) {
  logger.step(4, "Setting up database...");

  logger.info("Generating database schema...");
  const generateProcess = Bun.spawn(["bun", "run", "db:generate"], {
    cwd: rootDir,
  });
  await generateProcess.exited;
  if (generateProcess.exitCode !== 0) {
    logger.error("Failed to generate database schema");
    process.exit(1);
  }
  logger.success("Database schema generated");

  logger.info("Running migrations...");
  const migrateProcess = Bun.spawn(["bun", "run", "db:migrate"], {
    cwd: rootDir,
  });
  await migrateProcess.exited;
  if (migrateProcess.exitCode !== 0) {
    logger.error("Failed to run migrations");
    process.exit(1);
  }
  logger.success("Migrations complete");

  logger.info("Seeding database...");
  const seedProcess = Bun.spawn(["bun", "run", "db:seed"], {
    cwd: rootDir,
  });
  await seedProcess.exited;
  if (seedProcess.exitCode !== 0) {
    logger.error("Failed to seed database");
    process.exit(1);
  }
  logger.success("Database seeded");
} else {
  logger.info("Skipping database setup (--skip-db)");
}

logger.step(5, "Setting up git hooks...");
const prepareProcess = Bun.spawn(["bun", "run", "prepare"], {
  cwd: rootDir,
});
await prepareProcess.exited;
if (prepareProcess.exitCode !== 0) {
  logger.info("Git hooks setup skipped (not a git repo or already set up)");
} else {
  logger.success("Git hooks installed");
}

logger.step(6, "Running typecheck...");
const typecheckProcess = Bun.spawn(["bun", "run", "typecheck"], {
  cwd: rootDir,
});
await typecheckProcess.exited;
if (typecheckProcess.exitCode !== 0) {
  logger.warn("Typecheck found issues, but setup is complete");
  logger.info("Run 'bun run lint:fix' to auto-fix issues");
} else {
  logger.success("Typecheck passed");
}

logger.section("Setup Complete!");

logger.list("Edit .env and configure required variables");
logger.list("Run 'bun run dev' to start development server");
logger.list("Visit http://localhost:3000");