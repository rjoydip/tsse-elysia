#!/usr/bin/env bun

/**
 * Database seed script using drizzle-seed.
 *
 * Creates deterministic demo data for local development and testing.
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { seed, reset } from "drizzle-seed";
import { scriptLogger as logger } from "../src/lib/logger";
import * as schema from "../src/lib/db/schema";
import { env } from "~/config/env";

/**
 * Parsed CLI options for the seed script.
 */
export interface SeedOptions {
  count: number;
  seed: number;
  fresh: boolean;
}

/**
 * Default CLI options.
 */
export const DEFAULT_SEED_OPTIONS: SeedOptions = {
  count: 10,
  seed: 20260409,
  fresh: false,
};

/**
 * Parses a positive integer flag.
 */
function parsePositiveInteger(value: string, flagName: string): number {
  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${flagName} must be a non-negative integer. Received "${value}".`);
  }
  return parsedValue;
}

/**
 * Parses CLI arguments for the database seed script.
 */
export function parseSeedOptions(argv: string[]): SeedOptions {
  const options: SeedOptions = { ...DEFAULT_SEED_OPTIONS };
  for (const argument of argv) {
    if (argument === "--fresh") {
      options.fresh = true;
      continue;
    }
    if (argument.startsWith("--count=")) {
      options.count = parsePositiveInteger(argument.slice("--count=".length), "--count");
      continue;
    }
    if (argument.startsWith("--seed=")) {
      options.seed = parsePositiveInteger(argument.slice("--seed=".length), "--seed");
      continue;
    }
    throw new Error(`Unknown seed argument: ${argument}`);
  }
  return options;
}

/**
 * Resolves the database URL for seeding.
 */
function resolveDatabaseUrl(): string {
  if (env.SQLITE_URL) {
    return env.SQLITE_URL;
  }
  return "file:.artifacts/tsse-elysia.db";
}

/**
 * Verifies that the required database tables already exist before seeding.
 */
async function ensureRequiredTablesExist(client: ReturnType<typeof createClient>): Promise<void> {
  if (!env.SQLITE_URL) {
    logger.info("No SQLITE_URL configured, skipping table check...");
    return;
  }

  const requiredTables = ["user", "subscription_plan", "subscription"];
  for (const tableName of requiredTables) {
    const result = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      args: [tableName],
    });
    if (!result.rows || result.rows.length === 0) {
      throw new Error(
        `Database schema is missing table "${tableName}". Run "bun run db:migrate" first.`,
      );
    }
  }
}

/**
 * Seeds subscription plans with predefined data.
 */
async function seedPlans(db: ReturnType<typeof drizzle>): Promise<void> {
  const plans = [
    {
      id: "free",
      name: "Free",
      description: "Free tier for personal use",
      price: 0,
      currency: "USD",
      interval: "month",
      intervalCount: 1,
      features: JSON.stringify(["Core API access", "Community support"]),
      rateLimit: 100,
      rateLimitDuration: 60_000,
    },
    {
      id: "contributor",
      name: "Contributor",
      description: "Contributor tier for active users",
      price: 990,
      currency: "USD",
      interval: "month",
      intervalCount: 1,
      features: JSON.stringify(["Higher rate limits", "Priority fixes"]),
      rateLimit: 1_000,
      rateLimitDuration: 60_000,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Enterprise tier for organizations",
      price: 4_990,
      currency: "USD",
      interval: "month",
      intervalCount: 1,
      features: JSON.stringify(["Enterprise limits", "Dedicated support"]),
      rateLimit: 10_000,
      rateLimitDuration: 60_000,
    },
  ];

  const baseDate = new Date();
  const planRecords = plans.map((plan) => ({
    ...plan,
    createdAt: baseDate,
    updatedAt: baseDate,
  }));

  logger.info(`Seeding ${planRecords.length} subscription plans...`);
  await db.insert(schema.subscriptionPlans).values(planRecords);
}

/**
 * Main seed workflow.
 */
async function main(): Promise<void> {
  const options = parseSeedOptions(process.argv.slice(2));

  const dbUrl = resolveDatabaseUrl();

  const client = createClient({ url: dbUrl, authToken: env.SQLITE_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  try {
    logger.section("Database Seeding");
    logger.step(1, `Seeding database at ${dbUrl}`);
    logger.info(`Options: count=${options.count}, seed=${options.seed}, fresh=${options.fresh}`);

    await ensureRequiredTablesExist(client);

    if (options.fresh) {
      logger.info("Resetting existing seed data...");
      await reset(db as any, schema as any);
    }

    logger.step(2, "Seeding subscription plans...");
    await seedPlans(db);

    logger.step(3, "Seeding users with drizzle-seed...");
    await seed(db as any, { users: schema.users } as any, {
      count: options.count,
      seed: options.seed,
    });

    logger.success(`Database seeded with ${options.count} users.`);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : `Unknown seed failure: ${error}`);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  main();
}