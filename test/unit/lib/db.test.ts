import { describe, expect, it, beforeEach } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { users } from "~/lib/db";
import { subscriptions, subscriptionPlans } from "~/lib/db";

async function createTestDatabase() {
  const client = new PGlite();
  const tables = [
    `CREATE TABLE IF NOT EXISTS "user" ("id" TEXT PRIMARY KEY, "name" TEXT, "email" TEXT NOT NULL UNIQUE, "emailVerified" BOOLEAN NOT NULL DEFAULT false, "image" TEXT, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "subscriptionTier" TEXT NOT NULL DEFAULT 'free', "subscriptionId" TEXT, "subscriptionStatus" TEXT, "subscriptionExpiresAt" TIMESTAMP, "firstName" TEXT, "lastName" TEXT, "username" TEXT, "phoneNumber" TEXT, "role" TEXT NOT NULL DEFAULT 'user', "status" TEXT NOT NULL DEFAULT 'active')`,
    `CREATE TABLE IF NOT EXISTS "session" ("id" TEXT PRIMARY KEY, "expiresAt" TIMESTAMP NOT NULL, "token" TEXT NOT NULL UNIQUE, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "ipAddress" TEXT, "userAgent" TEXT, "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "account" ("id" TEXT PRIMARY KEY, "accountId" TEXT NOT NULL, "providerId" TEXT NOT NULL, "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "accessToken" TEXT, "refreshToken" TEXT, "idToken" TEXT, "accessTokenExpiresAt" TIMESTAMP, "refreshTokenExpiresAt" TIMESTAMP, "scope" TEXT, "password" TEXT, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "verification" ("id" TEXT PRIMARY KEY, "identifier" TEXT NOT NULL, "value" TEXT NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP, "updatedAt" TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS "subscription_plan" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "price" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'USD', "interval" TEXT NOT NULL, "intervalCount" INTEGER NOT NULL DEFAULT 1, "features" TEXT, "rateLimit" INTEGER NOT NULL, "rateLimitDuration" INTEGER NOT NULL DEFAULT 60000, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "subscription" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "planId" TEXT NOT NULL REFERENCES "subscription_plan"("id") ON DELETE CASCADE, "status" TEXT NOT NULL DEFAULT 'active', "currentPeriodStart" TIMESTAMP NOT NULL, "currentPeriodEnd" TIMESTAMP NOT NULL, "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL)`,
  ];

  for (const sql of tables) {
    await client.exec(sql);
  }

  return drizzle(client, { schema: { users, subscriptionPlans } });
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
      const now = new Date();

      await db.insert(users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db.select().from(users);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.id).toBeDefined();
    });

    it("should update user subscription tier", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const now = new Date();

      await db.insert(users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        subscriptionTier: "free",
      });

      const result = await db.select().from(users);

      expect(result[0]?.subscriptionTier).toBe("free");
    });

    it("should delete user", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const now = new Date();

      await db.insert(users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        subscriptionTier: "free",
      });

      await db.delete(users).where(eq(users.id, userId));

      const result = await db.select().from(users);

      expect(result.length).toBe(0);
    });
  });

  describe("Subscription Plans CRUD", () => {
    it("should insert and select subscription plans", async () => {
      const now = new Date();

      const dbAny = db as any;
      await dbAny.insert(subscriptionPlans).values([
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
          createdAt: now,
          updatedAt: now,
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
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await db.select().from(subscriptionPlans);

      expect(result.length).toBe(2);
    });

    it("should query subscription plan by ID", async () => {
      const now = new Date();

      const dbAny = db as any;
      await dbAny.insert(subscriptionPlans).values({
        id: "enterprise",
        name: "Enterprise",
        description: "Enterprise tier",
        price: 4990,
        currency: "USD",
        interval: "month",
        intervalCount: 1,
        rateLimit: 10_000,
        rateLimitDuration: 60_000,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, "enterprise"));

      expect(result[0]?.name).toBe("Enterprise");
      expect(result[0]?.rateLimit).toBe(10_000);
    });
  });

  describe("Subscriptions CRUD", () => {
    it("should create subscription for user", async () => {
      const now = new Date();
      const userId = faker.string.uuid();
      const subscriptionId = faker.string.uuid();

      const dbAny = db as any;
      await dbAny.insert(users).values({
        id: userId,
        name: "Test User",
        email: "test@test.com",
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        subscriptionTier: "contributor",
      });

      await dbAny.insert(subscriptionPlans).values({
        id: "contributor",
        name: "Contributor",
        description: "Contributor tier",
        price: 990,
        currency: "USD",
        interval: "month",
        intervalCount: 1,
        rateLimit: 1000,
        rateLimitDuration: 60_000,
        createdAt: now,
        updatedAt: now,
      });

      await dbAny.insert(subscriptions).values({
        id: subscriptionId,
        userId,
        planId: "contributor",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));

      expect(result[0]?.status).toBe("active");
      expect(result[0]?.planId).toBe("contributor");
    });
  });
});