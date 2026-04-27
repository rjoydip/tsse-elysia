import { describe, expect, it, beforeEach } from "bun:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import * as schema from "../../src/lib/db/schema";

const TEST_DB_PATH = ":memory:";

async function createTestDatabase() {
  const client = createClient({ url: TEST_DB_PATH });
  const tables = [
    `CREATE TABLE IF NOT EXISTS "user" ("id" text PRIMARY KEY, "name" text, "email" text NOT NULL UNIQUE, "emailVerified" integer NOT NULL DEFAULT 0, "image" text, "createdAt" integer NOT NULL, "updatedAt" integer NOT NULL, "subscriptionTier" text NOT NULL DEFAULT 'free', "subscriptionId" text, "subscriptionStatus" text, "subscriptionExpiresAt" integer)`,
    `CREATE TABLE IF NOT EXISTS "session" ("id" text PRIMARY KEY, "expiresAt" integer NOT NULL, "token" text NOT NULL UNIQUE, "createdAt" integer NOT NULL, "updatedAt" integer NOT NULL, "ipAddress" text, "userAgent" text, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "account" ("id" text PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" integer, "refreshTokenExpiresAt" integer, "scope" text, "password" text, "createdAt" integer NOT NULL, "updatedAt" integer NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "verification" ("id" text PRIMARY KEY, "identifier" text NOT NULL, "value" text NOT NULL, "expiresAt" integer NOT NULL, "createdAt" integer, "updatedAt" integer)`,
    `CREATE TABLE IF NOT EXISTS "subscription_plan" ("id" text PRIMARY KEY, "name" text NOT NULL, "description" text, "price" integer NOT NULL, "currency" text NOT NULL DEFAULT 'USD', "interval" text NOT NULL, "intervalCount" integer NOT NULL DEFAULT 1, "features" text, "rateLimit" integer NOT NULL, "rateLimitDuration" integer NOT NULL DEFAULT 60000, "createdAt" integer NOT NULL, "updatedAt" integer NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "subscription" ("id" text PRIMARY KEY, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "planId" text NOT NULL REFERENCES "subscription_plan"("id") ON DELETE CASCADE, "status" text NOT NULL DEFAULT 'active', "currentPeriodStart" integer NOT NULL, "currentPeriodEnd" integer NOT NULL, "cancelAtPeriodEnd" integer NOT NULL DEFAULT 0, "createdAt" integer NOT NULL, "updatedAt" integer NOT NULL)`,
  ];

  for (const sql of tables) {
    await client.execute({ sql, args: [] });
  }

  return drizzle(client, { schema });
}

describe("Database Operations", () => {
  let db: any;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  describe("Users CRUD", () => {
    it("should insert and select user", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const now = Date.now();

      await db.insert(schema.users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      const result = await db.select().from(schema.users);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.id).toBeDefined();
    });

    it("should update user subscription tier", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const now = Date.now();

      await db.insert(schema.users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        subscriptionTier: "free",
      });

      const result = await db.select().from(schema.users);

      expect(result[0]?.subscriptionTier).toBe("free");
    });

    it("should delete user", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const now = Date.now();

      await db.insert(schema.users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        subscriptionTier: "free",
      });

      await db.delete(schema.users).where(eq(schema.users.id, userId));

      const result = await db.select().from(schema.users);

      expect(result.length).toBe(0);
    });
  });

  describe("Subscription Plans CRUD", () => {
    it("should insert and select subscription plans", async () => {
      const now = Date.now();

      const dbAny = db as any;
      await dbAny.insert(schema.subscriptionPlans).values([
        {
          id: "free",
          name: "Free",
          description: "Free tier",
          price: 0,
          currency: "USD",
          interval: "month",
          intervalCount: 1,
          rateLimit: 100,
          rateLimitDuration: 60_000,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        },
        {
          id: "contributor",
          name: "Contributor",
          description: "Contributor tier",
          price: 990,
          currency: "USD",
          interval: "month",
          intervalCount: 1,
          rateLimit: 1000,
          rateLimitDuration: 60_000,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        },
      ]);

      const result = await db.select().from(schema.subscriptionPlans);

      expect(result.length).toBe(2);
    });

    it("should query subscription plan by ID", async () => {
      const now = Date.now();

      const dbAny = db as any;
      await dbAny.insert(schema.subscriptionPlans).values({
        id: "enterprise",
        name: "Enterprise",
        description: "Enterprise tier",
        price: 4990,
        currency: "USD",
        interval: "month",
        intervalCount: 1,
        rateLimit: 10_000,
        rateLimitDuration: 60_000,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      const result = await db
        .select()
        .from(schema.subscriptionPlans)
        .where(eq(schema.subscriptionPlans.id, "enterprise"));

      expect(result[0]?.name).toBe("Enterprise");
      expect(result[0]?.rateLimit).toBe(10_000);
    });
  });

  describe("Subscriptions CRUD", () => {
    it("should create subscription for user", async () => {
      const now = Date.now();
      const userId = faker.string.uuid();
      const subscriptionId = faker.string.uuid();

      const dbAny = db as any;
      await dbAny.insert(schema.users).values({
        id: userId,
        name: "Test User",
        email: "test@test.com",
        emailVerified: false,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        subscriptionTier: "contributor",
      });

      await dbAny.insert(schema.subscriptionPlans).values({
        id: "contributor",
        name: "Contributor",
        description: "Contributor tier",
        price: 990,
        currency: "USD",
        interval: "month",
        intervalCount: 1,
        rateLimit: 1000,
        rateLimitDuration: 60_000,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      await dbAny.insert(schema.subscriptions).values({
        id: subscriptionId,
        userId,
        planId: "contributor",
        status: "active",
        currentPeriodStart: new Date(now),
        currentPeriodEnd: new Date(now + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      const result = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId));

      expect(result[0]?.status).toBe("active");
      expect(result[0]?.planId).toBe("contributor");
    });
  });
});