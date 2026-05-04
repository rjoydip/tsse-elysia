#!/usr/bin/env bun

/**
 * Database seed script using drizzle-seed.
 *
 * Creates deterministic demo data for local development and testing.
 * Seeds admin users, subscription plans, and fake users.
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { reset } from "drizzle-seed";
import { scriptLogger as logger } from "../src/lib/logger";
import { subscriptionPlans } from "../src/lib/db/schema/subscriptions";
import { users, accounts } from "../src/lib/db/schema/auth";
import * as schema from "~/lib/db/schema";
import { env } from "~/config/env";
import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";

/**
 * User roles for user management.
 */
type UserRole = "superadmin" | "admin" | "manager" | "cashier" | "user";

/**
 * User status for user management.
 */
type UserStatus = "active" | "inactive" | "invited" | "suspended";

/**
 * Admin credentials for static admin accounts.
 */
const ADMIN_CREDENTIALS = [
  {
    email: "admin@tsse.local",
    password: "admin123",
    name: "Super Admin",
    firstName: "Super",
    lastName: "Admin",
    username: "superadmin",
    role: "superadmin" as UserRole,
    status: "active" as UserStatus,
  },
  {
    email: "manager@tsse.local",
    password: "manager123",
    name: "Test Manager",
    firstName: "Test",
    lastName: "Manager",
    username: "manager",
    role: "manager" as UserRole,
    status: "active" as UserStatus,
  },
];

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
  await db.insert(subscriptionPlans).values(planRecords);
}

/**
 * Seeds static admin users with email/password accounts.
 */
async function seedAdminUsers(db: ReturnType<typeof drizzle>): Promise<void> {
  const baseDate = new Date();

  for (const admin of ADMIN_CREDENTIALS) {
    const userId = crypto.randomUUID();
    const hashedPassword = await hash(admin.password, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      outputLen: 32,
      algorithm: 2,
    });

    logger.info(`Creating admin user: ${admin.email}`);

    await db.insert(users).values({
      id: userId,
      name: admin.name,
      email: admin.email,
      emailVerified: true,
      image: null,
      createdAt: baseDate,
      updatedAt: baseDate,
      subscriptionTier: "free",
      firstName: admin.firstName,
      lastName: admin.lastName,
      username: admin.username,
      phoneNumber: null,
      role: admin.role,
      status: admin.status,
    });

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "email",
      userId: userId,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      password: hashedPassword,
      createdAt: baseDate,
      updatedAt: baseDate,
    });
  }
}

/**
 * Generates fake users compatible with the extended schema.
 */
function generateFakeUsers(
  count: number,
  seed: number,
): Array<{
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  subscriptionTier: string;
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
}> {
  faker.seed(seed);
  const now = new Date();

  return Array.from({ length: count }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName }).toLocaleLowerCase();

    return {
      id: faker.string.uuid(),
      name: `${firstName} ${lastName}`,
      email,
      emailVerified: faker.datatype.boolean(),
      image: faker.image.avatar(),
      createdAt: faker.date.past({ years: 2, refDate: now }),
      updatedAt: faker.date.recent({ days: 30 }),
      subscriptionTier: faker.helpers.arrayElement(["free", "contributor", "enterprise"]),
      firstName,
      lastName,
      username: faker.internet.username({ firstName, lastName }).toLocaleLowerCase(),
      phoneNumber: faker.phone.number({ style: "international" }),
      role: faker.helpers.arrayElement(["admin", "manager", "cashier", "user"] as UserRole[]),
      status: faker.helpers.arrayElement([
        "active",
        "active",
        "active",
        "inactive",
        "invited",
        "suspended",
      ] as UserStatus[]),
    };
  });
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

    logger.step(3, "Seeding admin users...");
    await seedAdminUsers(db);

    logger.step(4, "Seeding fake users...");
    const fakeUsers = generateFakeUsers(options.count, options.seed);
    logger.info(`Generated ${fakeUsers.length} fake users`);

    logger.info("Inserting fake users into database...");
    await db.insert(users).values(fakeUsers);

    logger.success(
      `Database seeded with ${ADMIN_CREDENTIALS.length} admin + ${options.count} fake users.`,
    );
  } catch (error) {
    logger.error(error instanceof Error ? error.message : `Unknown seed failure: ${error}`);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  main();
}