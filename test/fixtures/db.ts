import { faker } from "@faker-js/faker";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../../src/lib/db/schema";
import type { SubscriptionTier } from "../../src/types/subscription";

const TEST_DB_PATH = ":memory:";

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    subscriptionTier TEXT NOT NULL DEFAULT 'free',
    subscriptionId TEXT,
    subscriptionStatus TEXT,
    subscriptionExpiresAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt INTEGER,
    refreshTokenExpiresAt INTEGER,
    scope TEXT,
    password TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER,
    updatedAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS subscription_plan (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    interval TEXT NOT NULL,
    intervalCount INTEGER NOT NULL DEFAULT 1,
    features TEXT,
    rateLimit INTEGER NOT NULL,
    rateLimitDuration INTEGER NOT NULL DEFAULT 60000,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subscription (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    planId TEXT NOT NULL REFERENCES subscription_plan(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    currentPeriodStart INTEGER NOT NULL,
    currentPeriodEnd INTEGER NOT NULL,
    cancelAtPeriodEnd INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );
`;

export { CREATE_TABLES_SQL };

export function createTestDatabase() {
  const client = createClient({
    url: TEST_DB_PATH,
  });
  client.execute(CREATE_TABLES_SQL);
  return drizzle(client, { schema });
}

export function cleanupTestDatabase() {
  // No cleanup needed for in-memory database
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  subscriptionTier: SubscriptionTier;
}

export function generateTestUser(overrides?: Partial<TestUser>): TestUser {
  const tier: SubscriptionTier = overrides?.subscriptionTier ?? "free";
  return {
    id: faker.string.uuid(),
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    password: faker.internet.password({ length: 12 }),
    subscriptionTier: tier,
    ...overrides,
  };
}

export function generateTestUsers(count: number, tier?: SubscriptionTier): TestUser[] {
  return Array.from({ length: count }, () => generateTestUser({ subscriptionTier: tier }));
}

export async function seedTestDatabase(db: ReturnType<typeof drizzle>) {
  const now = new Date();

  await db.insert(schema.subscriptionPlans).values([
    {
      id: "free",
      name: "Free",
      description: "Free tier for personal use",
      price: 0,
      currency: "USD",
      interval: "month",
      intervalCount: 1,
      features: JSON.stringify({ basicAccess: true, communitySupport: true }),
      rateLimit: 100,
      rateLimitDuration: 60_000,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "contributor",
      name: "Contributor",
      description: "Contributor tier for active users",
      price: 990,
      currency: "USD",
      interval: "month",
      intervalCount: 1,
      features: JSON.stringify({ basicAccess: true, prioritySupport: true }),
      rateLimit: 1000,
      rateLimitDuration: 60_000,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Enterprise tier for organizations",
      price: 4990,
      currency: "USD",
      interval: "month",
      intervalCount: 1,
      features: JSON.stringify({ basicAccess: true, dedicatedSupport: true }),
      rateLimit: 10000,
      rateLimitDuration: 60_000,
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

export { faker };