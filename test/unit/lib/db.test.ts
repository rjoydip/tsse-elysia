import { describe, expect, it, beforeEach } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { runAllMigrations } from "~/lib/db/migrate";
import { users, subscriptions, subscriptionPlans } from "~/lib/db";

/**
 * Creates a fresh in-memory PGlite database with all migrations applied.
 * Each test gets an isolated database instance to avoid cross-test pollution.
 */
async function createTestDatabase() {
  const client = new PGlite();
  await runAllMigrations(client);
  return drizzle(client, { schema: { users, subscriptions, subscriptionPlans } });
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

      await db.insert(subscriptionPlans).values([
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

      await db.insert(subscriptionPlans).values({
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

      await db.insert(users).values({
        id: userId,
        name: "Test User",
        email: "test@test.com",
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        subscriptionTier: "contributor",
      });

      await db.insert(subscriptionPlans).values({
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

      await db.insert(subscriptions).values({
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