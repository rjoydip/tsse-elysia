#!/usr/bin/env bun

/**
 * Database seed script using drizzle-seed.
 *
 * Creates deterministic demo data for local development and testing.
 * Seeds admin users, subscription plans, and fake users.
 *
 * Seeding modes:
 * - Production (NODE_ENV=production or --prod flag): only seeds essential
 *   admin accounts. No fake users or graph data.
 * - Dev/Default: seeds all admin accounts + fake users with graph-friendly
 *   createdAt timestamps spanning current year months and last 7 days.
 */

import { faker } from "@faker-js/faker";
import { eq, and, sql } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { reset } from "drizzle-seed";
import { nanoid } from "nanoid";
import { scriptLogger as logger } from "~/lib/logger";
import * as schema from "~/lib/db";
import { env } from "~/config/env";
import { initializeDatabase, getDatabasePools } from "~/config/db";

/**
 * User roles for user management.
 */
type UserRole = "admin" | "manager" | "cashier" | "user";

/**
 * User status for user management.
 */
type UserStatus = "active" | "inactive" | "invited" | "suspended";

/**
 * Essential seed accounts always created (admin).
 * These are the minimum needed for any deployment.
 */
const ESSENTIAL_USERS = [
  {
    email: "admin@tsse.local",
    password: "admin123",
    name: "Test Admin",
    firstName: "Test",
    lastName: "Admin",
    username: "admin",
    role: "admin" as UserRole,
    status: "active" as UserStatus,
  },
];

/**
 * Additional seed accounts created only in dev mode (manager, cashier, user).
 */
const DEV_USERS = [
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
  {
    email: "cashier@tsse.local",
    password: "cashier123",
    name: "Test Cashier",
    firstName: "Test",
    lastName: "Cashier",
    username: "cashier",
    role: "cashier" as UserRole,
    status: "active" as UserStatus,
  },
  {
    email: "user@tsse.local",
    password: "user123",
    name: "Test User",
    firstName: "Test",
    lastName: "User",
    username: "testuser",
    role: "user" as UserRole,
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
  prod: boolean;
}

/**
 * Default CLI options.
 */
export const DEFAULT_SEED_OPTIONS: SeedOptions = {
  count: 250,
  seed: 20260409,
  fresh: false,
  prod: false,
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
    if (argument === "--prod") {
      options.prod = true;
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
 * Returns true if running in production mode (either by NODE_ENV or --prod flag).
 */
function isProductionMode(options: SeedOptions): boolean {
  return options.prod || process.env.NODE_ENV === "production";
}

/**
 * Resolves the database configuration for seeding.
 */
function resolveDatabaseConfig(): { url?: string; dataDir?: string } {
  if (env.POSTGRES_URL) {
    return { url: env.POSTGRES_URL };
  }
  return { dataDir: env.PGLITE_DATA_DIR };
}

/**
 * Verifies that the required database tables already exist before seeding.
 */
async function ensureRequiredTablesExist(client: PGlite): Promise<void> {
  if (env.POSTGRES_URL) {
    logger.info("Using PostgreSQL URL, skipping table check...");
    return;
  }

  const requiredTables = ["user", "subscription_plan", "subscription", "tasks"];
  for (const tableName of requiredTables) {
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [tableName],
    );
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
  for (const plan of planRecords) {
    await db
      .insert(schema.subscriptionPlans)
      .values(plan)
      .onConflictDoUpdate({
        target: schema.subscriptionPlans.id,
        set: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          intervalCount: plan.intervalCount,
          features: plan.features,
          rateLimit: plan.rateLimit,
          rateLimitDuration: plan.rateLimitDuration,
          updatedAt: plan.updatedAt,
        },
      });
  }
}

/**
 * Seeds default system permissions.
 * Inserts standard CRUD permissions used across the application.
 */
async function seedPermissions(db: ReturnType<typeof drizzle>): Promise<void> {
  const systemPermissions: string[] = [
    "dashboard:read",
    "dashboard:write",
    "dashboard:analytics",
    "users:read",
    "users:write",
    "users:delete",
    "settings:read",
    "settings:write",
    "tasks:read",
    "tasks:write",
    "tasks:delete",
    "apps:read",
    "apps:write",
    "chats:read",
    "chats:write",
    "reports:read",
    "reports:write",
  ];

  const now = new Date();
  let seeded = 0;

  for (const name of systemPermissions) {
    try {
      await db
        .insert(schema.permissions)
        .values({
          id: nanoid(),
          name,
          description: `System permission: ${name}`,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: schema.permissions.name });
      seeded++;
    } catch {
      // Skip duplicates
    }
  }

  logger.info(`Seeded ${seeded} system permissions`);
}

/**
 * Default role-to-permission mappings matching src/lib/auth/permissions.ts.
 */
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  admin: [
    "dashboard:read",
    "dashboard:write",
    "dashboard:analytics",
    "users:read",
    "users:write",
    "settings:read",
    "settings:write",
    "tasks:read",
    "tasks:write",
    "apps:read",
    "apps:write",
    "chats:read",
    "chats:write",
    "reports:read",
    "reports:write",
  ],
  manager: [
    "dashboard:read",
    "dashboard:analytics",
    "users:read",
    "settings:read",
    "tasks:read",
    "tasks:write",
    "apps:read",
    "chats:read",
    "chats:write",
    "reports:read",
  ],
  cashier: [
    "dashboard:read",
    "tasks:read",
    "tasks:write",
    "apps:read",
    "chats:read",
    "chats:write",
  ],
  user: ["dashboard:read", "tasks:read", "apps:read", "chats:read", "chats:write"],
};

/**
 * Seeds default roles and their permission assignments.
 * Creates the 4 standard roles (admin, manager, cashier, user)
 * and links each to its appropriate set of permissions.
 * Runs in both fresh and production environments.
 */
async function seedRoles(db: ReturnType<typeof drizzle>): Promise<void> {
  const now = new Date();

  // Fetch all existing permissions into a name→id lookup
  const permRows = await db
    .select({ id: schema.permissions.id, name: schema.permissions.name })
    .from(schema.permissions);
  const permByName = new Map(permRows.map((r) => [r.name, r.id]));

  let roleCount = 0;

  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSION_MAP)) {
    try {
      const roleId = nanoid();
      await db
        .insert(schema.roles)
        .values({
          id: roleId,
          name: roleName,
          description: `Default ${roleName} role`,
          isDefault: roleName === "user",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: schema.roles.name });

      // Look up the role's actual ID (whether just inserted or pre-existing)
      const existingRole = await db
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(eq(schema.roles.name, roleName))
        .limit(1);

      if (existingRole.length === 0) continue;

      const actualRoleId = existingRole[0].id;

      // Assign permissions to the role
      for (const permName of permNames) {
        const permId = permByName.get(permName);
        if (!permId) {
          logger.warn(`Permission "${permName}" not found for role "${roleName}"`);
          continue;
        }

        try {
          // Check if association already exists
          const existing = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.rolePermissions)
            .where(
              and(
                eq(schema.rolePermissions.roleId, actualRoleId),
                eq(schema.rolePermissions.permissionId, permId),
              ),
            );

          if (existing[0]?.count === 0) {
            await db
              .insert(schema.rolePermissions)
              .values({ roleId: actualRoleId, permissionId: permId });
          }
        } catch (error) {
          logger.warn(`Failed to assign permission "${permName}" to role "${roleName}": ${error}`);
        }
      }

      roleCount++;
    } catch (error) {
      logger.warn(`Failed to seed role "${roleName}": ${error}`);
    }
  }

  logger.info(`Seeded ${roleCount} default roles with permission assignments`);
}

/**
 * Seeds static users by inserting them directly into the database
 * with properly hashed passwords. No running server required.
 *
 * Uses Argon2id matching the hash config in src/lib/auth/index.ts
 * so Better Auth can verify passwords during sign-in.
 */
async function seedUsers(
  db: ReturnType<typeof drizzle>,
  userList: typeof ESSENTIAL_USERS,
): Promise<void> {
  const { nanoid } = await import("nanoid");
  const { hash } = await import("@node-rs/argon2");

  const hashOpts = {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    outputLen: 32,
    algorithm: 2,
  };

  for (const user of userList) {
    logger.info(`Creating user: ${user.email}`);

    try {
      const hashedPassword = await hash(user.password, hashOpts);
      const now = new Date();
      const userId = nanoid();

      // Insert into user table
      await db.insert(schema.users).values({
        id: userId,
        name: user.name,
        email: user.email,
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
        subscriptionTier: "free",
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phoneNumber: null,
        role: user.role,
        status: user.status,
      });

      // Insert into account table (Better Auth stores password hash here)
      await db.insert(schema.accounts).values({
        id: nanoid(),
        accountId: userId,
        providerId: "credential",
        userId,
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      logger.info(`Created user: ${user.email} with ID: ${userId}`);
    } catch (error) {
      if (error instanceof Error && error.message?.includes("unique")) {
        logger.info(`User ${user.email} already exists, updating role`);
      } else {
        logger.warn(`Could not create user ${user.email}: ${error}`);
        continue;
      }
    }

    // Update role, first/last name, username
    try {
      await db
        .update(schema.users)
        .set({
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
        })
        .where(eq(schema.users.email, user.email));

      logger.info(`Updated role to ${user.role} for ${user.email}`);
    } catch (error) {
      logger.warn(`Failed to update role for ${user.email}: ${error}`);
    }
  }
}

/**
 * Generates fake users compatible with the extended schema.
 * In dev mode, creates users with createdAt spread across current year months
 * and the last 7 days — so the dashboard overview chart (monthly bar chart)
 * and weekly registrations chart show meaningful data.
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
  const now = Date.now();
  const currentYear = new Date().getFullYear();

  // Distribute users across:
  // - 80% across current year months (for monthly bar chart)
  // - 20% across the last 7 days (for weekly registrations chart)
  const monthlyCount = Math.floor(count * 0.8);
  const weeklyCount = count - monthlyCount;

  const users: Array<{
    id: string;
    name: string;
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
  }> = [];

  for (let i = 0; i < monthlyCount; i++) {
    // Spread evenly across all 12 months of the current year with varying daily offsets
    const month = i % 12; // 0=Jan .. 11=Dec
    const dayOfMonth = Math.min(28, Math.floor(i / 12) + 1); // distribute within the month
    const yearStart = new Date(currentYear, month, dayOfMonth).getTime();
    const monthEnd = new Date(currentYear, month + 1, 0).getTime();
    // Add random hours within the day to avoid collisions
    const ms = yearStart + faker.number.int({ max: Math.max(0, monthEnd - yearStart) });
    const createdAt = new Date(ms);

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName }).toLocaleLowerCase();

    users.push({
      id: faker.string.uuid(),
      name: `${firstName} ${lastName}`,
      email,
      emailVerified: faker.datatype.boolean(),
      image: faker.image.avatar(),
      createdAt,
      updatedAt: faker.date.recent({ days: 30 }),
      subscriptionTier: faker.helpers.arrayElement(["free", "contributor", "enterprise"]),
      firstName,
      lastName,
      username: faker.internet.username({ firstName, lastName }).toLocaleLowerCase(),
      phoneNumber: faker.phone.number({ style: "international" }),
      role: faker.helpers.arrayElement([
        "user",
        "user",
        "user",
        "cashier",
        "manager",
      ] as UserRole[]),
      status: faker.helpers.arrayElement([
        "active",
        "active",
        "active",
        "inactive",
        "invited",
        "suspended",
      ] as UserStatus[]),
    });
  }

  for (let i = 0; i < weeklyCount; i++) {
    // Skew heavily toward the last 2 days so data stays visible longer
    // after seeding. 60% in last 24h, 25% in 24-48h, 15% in 48h-7d.
    const skew = faker.number.int({ max: 99 });
    let daysAgo: number;
    if (skew < 60) {
      daysAgo = faker.number.int({ max: 0 }); // today only
    } else if (skew < 85) {
      daysAgo = faker.number.int({ max: 1, min: 1 }); // yesterday
    } else {
      daysAgo = faker.number.int({ max: 6, min: 2 }); // 2-6 days ago
    }
    const hoursOffset = faker.number.int({ max: 23 });
    const minutesOffset = faker.number.int({ max: 59 });
    const createdAt = new Date(
      now - daysAgo * 86400000 - hoursOffset * 3600000 - minutesOffset * 60000,
    );

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName }).toLocaleLowerCase();

    users.push({
      id: faker.string.uuid(),
      name: `${firstName} ${lastName}`,
      email,
      emailVerified: faker.datatype.boolean(),
      image: faker.image.avatar(),
      createdAt,
      updatedAt: faker.date.recent({ days: 1 }),
      subscriptionTier: faker.helpers.arrayElement(["free", "contributor", "enterprise"]),
      firstName,
      lastName,
      username: faker.internet.username({ firstName, lastName }).toLocaleLowerCase(),
      phoneNumber: faker.phone.number({ style: "international" }),
      role: faker.helpers.arrayElement(["user", "user", "user", "cashier"] as UserRole[]),
      status: faker.helpers.arrayElement([
        "active",
        "active",
        "active",
        "active",
        "inactive",
        "suspended",
      ] as UserStatus[]),
    });
  }

  return users;
}

/**
 * Task templates for seeding.
 */
const TASK_TEMPLATES = [
  {
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated builds and deployments",
    status: "todo",
    priority: "high",
    label: "feature",
  },
  {
    title: "Fix login redirect bug",
    description: "Users are not redirected to the correct page after login",
    status: "in-progress",
    priority: "critical",
    label: "bug",
  },
  {
    title: "Update API documentation",
    description: "Add OpenAPI specs for the new endpoints",
    status: "review",
    priority: "medium",
    label: "documentation",
  },
  {
    title: "Refactor database queries",
    description: "Optimize slow queries in the user repository",
    status: "done",
    priority: "high",
    label: "feature",
  },
  {
    title: "Add dark mode support",
    description: "Implement theme toggle with system preference detection",
    status: "backlog",
    priority: "low",
    label: "feature",
  },
  {
    title: "Implement rate limiting",
    description: "Add rate limiting middleware to API routes",
    status: "todo",
    priority: "high",
    label: "feature",
  },
  {
    title: "Fix mobile layout issues",
    description: "Sidebar overlaps content on small screens",
    status: "in-progress",
    priority: "medium",
    label: "bug",
  },
  {
    title: "Write unit tests for auth",
    description: "Cover sign-up, sign-in, and session refresh flows",
    status: "review",
    priority: "high",
    label: "feature",
  },
  {
    title: "Upgrade dependencies",
    description: "Bump all packages to latest compatible versions",
    status: "backlog",
    priority: "low",
    label: "feature",
  },
  {
    title: "Add search functionality",
    description: "Full-text search across tasks and users",
    status: "canceled",
    priority: "medium",
    label: "feature",
  },
  {
    title: "Improve error messages",
    description: "Show user-friendly error messages for API failures",
    status: "todo",
    priority: "medium",
    label: "feature",
  },
  {
    title: "Session expiry handling",
    description: "Show a warning before session times out",
    status: "in-progress",
    priority: "high",
    label: "bug",
  },
  {
    title: "Performance audit",
    description: "Run Lighthouse and identify performance bottlenecks",
    status: "review",
    priority: "low",
    label: "documentation",
  },
  {
    title: "Database backup strategy",
    description: "Automate daily backups to cloud storage",
    status: "done",
    priority: "high",
    label: "feature",
  },
  {
    title: "User onboarding flow",
    description: "Design and implement first-time user experience",
    status: "backlog",
    priority: "medium",
    label: "feature",
  },
];

/**
 * Seeds demo tasks for dev users.
 * Creates tasks with varied statuses, priorities, and dates so the
 * dashboard Kanban board, stats cards, and monthly chart show data.
 */
async function seedTasks(db: ReturnType<typeof drizzle>): Promise<void> {
  // Fetch all users that have been seeded
  const allUsers = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users);

  if (allUsers.length === 0) {
    logger.warn("No users found, skipping task seeding");
    return;
  }

  // Idempotent: only seed tasks for users without any
  const usersWithTasks = await db
    .select({ userId: schema.tasks.userId })
    .from(schema.tasks)
    .groupBy(schema.tasks.userId);
  const userIdsWithTasks = new Set(usersWithTasks.map((r) => r.userId));
  const usersToSeed = allUsers.filter((u) => !userIdsWithTasks.has(u.id));

  if (usersToSeed.length === 0) {
    logger.info("All users already have tasks, skipping");
    return;
  }

  logger.info(
    `Seeding tasks for ${usersToSeed.length} new user(s) (${allUsers.length - usersToSeed.length} already have tasks)`,
  );

  // Only use the fixed faker seed when seeding ALL users (fresh);
  // incremental runs avoid it so generated UUIDs don't collide with existing rows.
  if (usersToSeed.length === allUsers.length) {
    faker.seed(20260409);
  }
  const now = Date.now();
  let seededCount = 0;

  for (const user of usersToSeed) {
    // Give each user a subset of tasks (5–12)
    const taskCount = faker.number.int({ min: 5, max: 12 });

    for (let i = 0; i < taskCount; i++) {
      const template = faker.helpers.arrayElement(TASK_TEMPLATES);

      const daysAgo = faker.number.int({ min: 0, max: 365 });
      const createdAt = new Date(
        now - daysAgo * 86400000 - faker.number.int({ max: 86399 }) * 1000,
      );

      // Some tasks get due dates (past or future)
      let dueDate: Date | null = null;
      if (faker.datatype.boolean(0.6)) {
        const dueOffset = faker.number.int({ min: -30, max: 60 });
        dueDate = new Date(createdAt.getTime() + dueOffset * 86400000);
      }

      // Archive state is tracked by `archivedAt`, not by the status column.
      // The status column must always be one of the 6 canonical values.
      // ~8% of tasks get archived/canceled; rest keep their template status.
      const statusRoll = faker.number.int({ max: 99 });
      const isArchived = statusRoll < 5;
      let status = template.status;
      if (isArchived) {
        // keep original status — archivedAt tracks the archive state
      } else if (statusRoll < 8) {
        status = "canceled";
      } else if (template.status === "done" && faker.datatype.boolean(0.3)) {
        status = "done";
      } else if (template.status === "done") {
        status = faker.helpers.arrayElement(["todo", "in-progress", "review", "backlog"]);
      }

      // Set updatedAt to reflect when the task was last changed.
      // For done tasks, use a recent timestamp so the monthly chart
      // shows them as completed in the current year.
      let updatedAt: Date;
      if (status === "done") {
        const doneDaysAgo = faker.number.int({ min: 0, max: 90 });
        updatedAt = new Date(now - doneDaysAgo * 86400000);
      } else {
        updatedAt = new Date(createdAt.getTime() + faker.number.int({ min: 0, max: 86400000 * 7 }));
      }

      try {
        await db.insert(schema.tasks).values({
          id: faker.string.uuid(),
          title: template.title,
          description: template.description,
          status,
          priority: template.priority,
          label: template.label,
          userId: user.id,
          assignee: null,
          dueDate: dueDate,
          createdAt,
          updatedAt,
          archivedAt: isArchived ? new Date(now - faker.number.int({ max: 30 }) * 86400000) : null,
          deletedAt: null,
        } as schema.NewTask);
        seededCount++;
      } catch {
        // Skip conflicts
      }
    }
  }

  logger.info(
    `Seeded ${seededCount} demo tasks for ${usersToSeed.length} user(s) (skipped ${
      allUsers.length - usersToSeed.length
    } with existing tasks)`,
  );
}

/**
 * Main seed workflow.
 */
async function main(): Promise<void> {
  const options = parseSeedOptions(process.argv.slice(2));
  const isProd = isProductionMode(options);

  // Use shared database initialization (auto-migrates PGlite).
  // For real PostgreSQL, the server must have run db:migrate already.
  const dbConfig = resolveDatabaseConfig();
  const usePgUrl = !!dbConfig.url;

  let db: ReturnType<typeof drizzle>;
  let client: PGlite | null;

  if (usePgUrl) {
    // Real PG — rely on server having run db:migrate
    db = (await import("../src/config/db")).db;
    client = null;
  } else {
    // PGlite — initializeDatabase auto-migrates on startup
    await initializeDatabase();
    const pools = getDatabasePools();
    client = pools.client;
    db = (await import("../src/config/db")).db;
  }

  try {
    logger.section("Database Seeding");
    logger.step(1, `Seeding database at ${usePgUrl ? dbConfig.url : "PGlite (auto-migrated)"}`);
    logger.info(`Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`);
    logger.info(`Options: count=${options.count}, seed=${options.seed}, fresh=${options.fresh}`);

    if (client) await ensureRequiredTablesExist(client);

    if (options.fresh) {
      logger.info("Resetting existing seed data...");
      await reset(db as any, schema as any);
    }

    logger.step(2, "Seeding subscription plans...");
    await seedPlans(db);

    logger.step(3, "Seeding system permissions...");
    await seedPermissions(db);

    logger.step(4, "Seeding default roles...");
    await seedRoles(db);

    // In production, only seed essential admin accounts
    const usersToSeed = isProd ? ESSENTIAL_USERS : [...ESSENTIAL_USERS, ...DEV_USERS];
    logger.step(5, `Seeding ${usersToSeed.length} static user(s)...`);
    await seedUsers(db, usersToSeed);

    if (!isProd) {
      // Dev mode: seed fake users with graph-friendly timestamps
      logger.step(6, "Seeding fake users for charts...");
      const fakeUsers = generateFakeUsers(options.count, options.seed);
      logger.info(`Generated ${fakeUsers.length} fake users`);

      logger.info("Inserting fake users into database (skipping duplicates)...");
      let inserted = 0;
      for (const user of fakeUsers) {
        try {
          await db.insert(schema.users).values(user);
          inserted++;
        } catch {
          // Skip duplicates
        }
      }
      logger.info(`Inserted ${inserted} of ${fakeUsers.length} fake users`);

      logger.success(`Database seeded with ${usersToSeed.length} static + ${inserted} fake users.`);
    } else {
      logger.success(`Database seeded with ${usersToSeed.length} static users (production mode).`);
    }

    // Link each seeded user to their corresponding role in the userRoles junction table.
    // Without this, dynamic RBAC permission resolution is bypassed for seeded users.
    logger.step(isProd ? 6 : 7, "Linking users to roles via userRoles junction...");

    // Build a name→id lookup for all roles
    const allRoles = await db
      .select({ id: schema.roles.id, name: schema.roles.name })
      .from(schema.roles);
    const roleByName = new Map(allRoles.map((r: { name: string; id: string }) => [r.name, r.id]));

    // Fetch all users and link each to the role matching their `role` column
    const allUsers = await db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users);
    let linkedCount = 0;
    for (const user of allUsers) {
      const roleId = roleByName.get(user.role ?? "user");
      if (!roleId) continue;

      // Insert only if not already linked (idempotent)
      const exists = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.userRoles)
        .where(
          and(
            eq(schema.userRoles.userId, user.id as string),
            eq(schema.userRoles.roleId, roleId as string),
          ),
        );
      if ((exists[0]?.count ?? 0) === 0) {
        try {
          await db.insert(schema.userRoles).values({ userId: user.id, roleId });
          linkedCount++;
        } catch {
          // Skip conflicts
        }
      }
    }
    logger.info(`Linked ${linkedCount} users to their RBAC roles`);

    if (!isProd) {
      logger.step(isProd ? 7 : 8, "Seeding demo tasks for dashboard...");
      await seedTasks(db);
    }

    process.exit(0);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : `Unknown seed failure: ${error}`);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}