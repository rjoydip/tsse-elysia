import { describe, expect, it, beforeEach } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { runAllMigrations } from "~/lib/db/migrate";
import * as schema from "~/lib/db";

/**
 * Creates a fresh in-memory PGlite database with all migrations applied.
 * Each test gets an isolated database instance to avoid cross-test pollution.
 * Uses the full schema object so all tables, types, and relations are
 * registered with Drizzle ORM.
 */
async function createTestDatabase() {
  const client = new PGlite();
  await runAllMigrations(client);
  return drizzle(client, { schema });
}

/**
 * Inserts a minimal user fixture and returns the user ID.
 */
async function insertUserFixture(db: any): Promise<string> {
  const userId = faker.string.uuid();
  const now = new Date();
  await db.insert(schema.users).values({
    id: userId,
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });
  return userId;
}

describe("Database Operations", () => {
  let db: any;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  // ---- Existing tested tables (kept for backward compat) ----

  describe("Users CRUD", () => {
    it("should insert and select user", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const now = new Date();

      await db.insert(schema.users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db.select().from(schema.users);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.id).toBeDefined();
    });

    it("should update user subscription tier", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const now = new Date();

      await db.insert(schema.users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        subscriptionTier: "free",
      });

      const result = await db.select().from(schema.users);

      expect(result[0]?.subscriptionTier).toBe("free");
    });

    it("should delete user", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const now = new Date();

      await db.insert(schema.users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        subscriptionTier: "free",
      });

      await db.delete(schema.users).where(eq(schema.users.id, userId));

      const result = await db.select().from(schema.users);

      expect(result.length).toBe(0);
    });
  });

  describe("Subscription Plans CRUD", () => {
    it("should insert and select subscription plans", async () => {
      const now = new Date();

      await db.insert(schema.subscriptionPlans).values([
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

      const result = await db.select().from(schema.subscriptionPlans);

      expect(result.length).toBe(2);
    });

    it("should query subscription plan by ID", async () => {
      const now = new Date();

      await db.insert(schema.subscriptionPlans).values({
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
        .from(schema.subscriptionPlans)
        .where(eq(schema.subscriptionPlans.id, "enterprise"));

      expect(result[0]?.name).toBe("Enterprise");
      expect(result[0]?.rateLimit).toBe(10_000);
    });
  });

  describe("Subscriptions CRUD", () => {
    it("should create subscription for user", async () => {
      const now = new Date();
      const userId = faker.string.uuid();
      const subscriptionId = faker.string.uuid();

      await db.insert(schema.users).values({
        id: userId,
        name: "Test User",
        email: "test@test.com",
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        subscriptionTier: "contributor",
      });

      await db.insert(schema.subscriptionPlans).values({
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

      await db.insert(schema.subscriptions).values({
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

      const result = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId));

      expect(result[0]?.status).toBe("active");
      expect(result[0]?.planId).toBe("contributor");
    });
  });

  // ---- New table coverage ----

  describe("Roles CRUD", () => {
    it("should insert and select roles", async () => {
      const now = new Date();

      await db.insert(schema.roles).values([
        { id: "admin", name: "admin", isDefault: false, createdAt: now, updatedAt: now },
        { id: "user", name: "user", isDefault: true, createdAt: now, updatedAt: now },
      ]);

      const result = await db.select().from(schema.roles);

      expect(result.length).toBe(2);
      const adminRole = result.find((r: any) => r.id === "admin");
      expect(adminRole?.name).toBe("admin");
    });
  });

  describe("Permissions CRUD", () => {
    it("should insert and select permissions", async () => {
      const now = new Date();

      await db.insert(schema.permissions).values([
        {
          id: "dashboard:read",
          name: "dashboard:read",
          description: "View dashboard",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "users:write",
          name: "users:write",
          description: "Edit users",
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await db.select().from(schema.permissions);

      expect(result.length).toBe(2);
    });
  });

  describe("UserRoles junction CRUD", () => {
    it("should link user to role", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.roles).values({
        id: "admin-test",
        name: "admin",
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(schema.userRoles).values({ userId, roleId: "admin-test" });

      const result = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, userId));

      expect(result.length).toBe(1);
      expect(result[0]?.roleId).toBe("admin-test");
    });

    it("should handle duplicate link gracefully with onConflictDoNothing", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.roles).values({
        id: "user-test",
        name: "user",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });

      // First insert succeeds
      await db.insert(schema.userRoles).values({ userId, roleId: "user-test" });

      // Second insert with onConflictDoNothing should silently skip
      await db
        .insert(schema.userRoles)
        .values({ userId, roleId: "user-test" })
        .onConflictDoNothing();

      const count = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, userId));
      expect(count.length).toBe(1);
    });
  });

  describe("RolePermissions junction CRUD", () => {
    it("should link permission to role", async () => {
      const now = new Date();

      await db.insert(schema.roles).values({
        id: "rp-role",
        name: "manager",
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      });
      await db.insert(schema.permissions).values({
        id: "rp:read",
        name: "reports:read",
        createdAt: now,
        updatedAt: now,
      });

      await db
        .insert(schema.rolePermissions)
        .values({ roleId: "rp-role", permissionId: "rp:read" });

      const result = await db
        .select()
        .from(schema.rolePermissions)
        .where(eq(schema.rolePermissions.roleId, "rp-role"));

      expect(result.length).toBe(1);
      expect(result[0]?.permissionId).toBe("rp:read");
    });

    it("should handle duplicate link gracefully with onConflictDoNothing", async () => {
      const now = new Date();

      await db.insert(schema.roles).values({
        id: "rp-dup",
        name: "cashier",
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      });
      await db.insert(schema.permissions).values({
        id: "rp:dup",
        name: "tasks:read",
        createdAt: now,
        updatedAt: now,
      });

      // First insert succeeds
      await db.insert(schema.rolePermissions).values({ roleId: "rp-dup", permissionId: "rp:dup" });

      // Second insert with onConflictDoNothing should silently skip
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: "rp-dup", permissionId: "rp:dup" })
        .onConflictDoNothing();

      const count = await db
        .select()
        .from(schema.rolePermissions)
        .where(eq(schema.rolePermissions.roleId, "rp-dup"));
      expect(count.length).toBe(1);
    });
  });

  describe("Tasks CRUD", () => {
    it("should insert task with enum status", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.tasks).values({
        id: faker.string.uuid(),
        title: "Test task",
        status: "in-progress",
        priority: "high",
        label: "feature",
        userId,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db.select().from(schema.tasks);

      expect(result.length).toBe(1);
      expect(result[0]?.status).toBe("in-progress");
      expect(result[0]?.priority).toBe("high");
    });

    it("should query tasks by user", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.tasks).values({
        id: faker.string.uuid(),
        title: "User task",
        status: "todo",
        priority: "medium",
        label: "bug",
        userId,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db.select().from(schema.tasks).where(eq(schema.tasks.userId, userId));

      expect(result.length).toBe(1);
    });
  });

  describe("MCP API Keys CRUD", () => {
    it("should insert and select an API key", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.mcpApiKeys).values({
        id: faker.string.uuid(),
        name: "Test Key",
        keyHash: faker.string.alphanumeric(40),
        userId,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(schema.mcpApiKeys)
        .where(eq(schema.mcpApiKeys.userId, userId));

      expect(result.length).toBe(1);
      expect(result[0]?.name).toBe("Test Key");
    });
  });

  describe("Sessions CRUD", () => {
    it("should insert and select session", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.sessions).values({
        id: faker.string.uuid(),
        token: faker.string.alphanumeric(32),
        userId,
        expiresAt: new Date(now.getTime() + 86_400_000),
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.userId, userId));

      expect(result.length).toBe(1);
    });
  });

  describe("Accounts CRUD", () => {
    it("should insert and select account", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.accounts).values({
        id: faker.string.uuid(),
        accountId: faker.string.alphanumeric(16),
        providerId: "github",
        userId,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.userId, userId));

      expect(result.length).toBe(1);
      expect(result[0]?.providerId).toBe("github");
    });
  });

  describe("Verifications CRUD", () => {
    it("should insert and select verification", async () => {
      const now = new Date();

      await db.insert(schema.verifications).values({
        id: faker.string.uuid(),
        identifier: faker.internet.email(),
        value: faker.string.alphanumeric(6),
        expiresAt: new Date(now.getTime() + 3600_000),
      });

      const result = await db.select().from(schema.verifications);

      expect(result.length).toBe(1);
    });
  });

  describe("ServiceHealth CRUD", () => {
    it("should insert health record with auto-increment serial PK", async () => {
      const now = new Date();

      await db.insert(schema.serviceHealth).values({
        serviceName: "database",
        status: "up",
        latencyMs: 5,
        timestamp: now,
      });

      const result = await db.select().from(schema.serviceHealth);

      expect(result.length).toBe(1);
      expect(result[0]?.id).toBeDefined();
      // Serial PK should be auto-incremented
      expect(typeof result[0]?.id).toBe("number");
    });
  });

  describe("User Settings CRUD", () => {
    it("should insert account settings for user", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.userSettingsAccount).values({
        id: faker.string.uuid(),
        userId,
        name: "Test User",
        language: "en",
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(schema.userSettingsAccount)
        .where(eq(schema.userSettingsAccount.userId, userId));

      expect(result.length).toBe(1);
      expect(result[0]?.language).toBe("en");
    });

    it("should insert display settings for user", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.userSettingsDisplay).values({
        id: faker.string.uuid(),
        userId,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(schema.userSettingsDisplay)
        .where(eq(schema.userSettingsDisplay.userId, userId));

      expect(result.length).toBe(1);
    });

    it("should insert notification settings with enum type", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.userSettingsNotifications).values({
        id: faker.string.uuid(),
        userId,
        type: "all",
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(schema.userSettingsNotifications)
        .where(eq(schema.userSettingsNotifications.userId, userId));

      expect(result.length).toBe(1);
      expect(result[0]?.type).toBe("all");
    });

    it("should insert profile settings for user", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.userSettingsProfile).values({
        id: faker.string.uuid(),
        userId,
        username: faker.internet.username(),
        email: faker.internet.email().toLowerCase(),
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(schema.userSettingsProfile)
        .where(eq(schema.userSettingsProfile.userId, userId));

      expect(result.length).toBe(1);
    });
  });

  // ---- Relations test ----

  describe("Drizzle Relations", () => {
    it("should eager-load user with roles via findFirst", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.roles).values([
        { id: "rel-admin", name: "admin", isDefault: false, createdAt: now, updatedAt: now },
        { id: "rel-user", name: "user", isDefault: true, createdAt: now, updatedAt: now },
      ]);

      await db.insert(schema.userRoles).values([
        { userId, roleId: "rel-admin" },
        { userId, roleId: "rel-user" },
      ]);

      const userWithRoles = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        with: {
          userRoles: true,
        },
      });

      expect(userWithRoles).toBeDefined();
      expect(userWithRoles?.userRoles).toBeDefined();
      expect(Array.isArray(userWithRoles?.userRoles)).toBe(true);
      expect(userWithRoles?.userRoles.length).toBe(2);
    });

    it("should eager-load user with subscriptions via findFirst", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.subscriptionPlans).values({
        id: "eager-plan",
        name: "Eager Plan",
        description: "For eager loading test",
        price: 0,
        currency: "USD",
        interval: "month",
        intervalCount: 1,
        rateLimit: 100,
        rateLimitDuration: 60_000,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(schema.subscriptions).values({
        id: faker.string.uuid(),
        userId,
        planId: "eager-plan",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });

      const userWithSubs = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        with: {
          subscriptions: true,
        },
      });

      expect(userWithSubs).toBeDefined();
      expect(userWithSubs?.subscriptions).toBeDefined();
      expect(userWithSubs?.subscriptions.length).toBe(1);
      expect(userWithSubs?.subscriptions[0]?.planId).toBe("eager-plan");
    });

    it("should cascade-delete userRoles when user is deleted", async () => {
      const now = new Date();
      const userId = await insertUserFixture(db);

      await db.insert(schema.roles).values({
        id: "cascade-role",
        name: "user",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(schema.userRoles).values({ userId, roleId: "cascade-role" });

      // Delete the user (FK cascade should clean up userRoles)
      await db.delete(schema.users).where(eq(schema.users.id, userId));

      const remaining = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, userId));

      expect(remaining.length).toBe(0);
    });
  });
});