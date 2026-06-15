import { describe, expect, it, beforeEach } from "bun:test";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { faker } from "@faker-js/faker";
import { accounts, users, sessions, verifications } from "~/lib/db";

async function createTestDatabase() {
  const client = new PGlite();
  const tables = [
    `CREATE TABLE IF NOT EXISTS "user" ("id" TEXT PRIMARY KEY, "name" TEXT, "email" TEXT NOT NULL UNIQUE, "emailVerified" BOOLEAN NOT NULL DEFAULT false, "image" TEXT, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "subscriptionTier" TEXT NOT NULL DEFAULT 'free', "subscriptionId" TEXT, "subscriptionStatus" TEXT, "subscriptionExpiresAt" TIMESTAMP, "firstName" TEXT, "lastName" TEXT, "username" TEXT, "phoneNumber" TEXT, "role" TEXT NOT NULL DEFAULT 'user', "status" TEXT NOT NULL DEFAULT 'active')`,
    `CREATE TABLE IF NOT EXISTS "session" ("id" TEXT PRIMARY KEY, "expiresAt" TIMESTAMP NOT NULL, "token" TEXT NOT NULL UNIQUE, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "ipAddress" TEXT, "userAgent" TEXT, "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "account" ("id" TEXT PRIMARY KEY, "accountId" TEXT NOT NULL, "providerId" TEXT NOT NULL, "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "accessToken" TEXT, "refreshToken" TEXT, "idToken" TEXT, "accessTokenExpiresAt" TIMESTAMP, "refreshTokenExpiresAt" TIMESTAMP, "scope" TEXT, "password" TEXT, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "verification" ("id" TEXT PRIMARY KEY, "identifier" TEXT NOT NULL, "value" TEXT NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP, "updatedAt" TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS "subscription_plan" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "price" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'USD', "interval" TEXT NOT NULL, "intervalCount" INTEGER NOT NULL DEFAULT 1, "features" TEXT, "rateLimit" INTEGER NOT NULL, "rateLimitDuration" INTEGER NOT NULL DEFAULT 60000, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "subscription" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "planId" TEXT NOT NULL REFERENCES "subscription_plan"("id") ON DELETE CASCADE, "status" TEXT NOT NULL DEFAULT 'active', "currentPeriodStart" TIMESTAMP NOT NULL, "currentPeriodEnd" TIMESTAMP NOT NULL, "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "mcp_api_key" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "keyHash" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "organizationId" TEXT, "permissions" TEXT, "rateLimit" INTEGER NOT NULL DEFAULT 100, "rateLimitDuration" INTEGER NOT NULL DEFAULT 60000, "lastUsedAt" TIMESTAMP, "expiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL)`,
  ];

  for (const sql of tables) {
    await client.exec(sql);
  }

  return drizzle(client, {
    schema: { users, sessions, accounts, verifications },
  });
}

describe("Authentication", () => {
  let db: Awaited<ReturnType<typeof drizzle>>;
  let auth: any;

  beforeEach(async () => {
    db = await createTestDatabase();
    auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
          user: users,
          session: sessions,
          account: accounts,
          verification: verifications,
        },
      }),
      secret: "test-secret-123456789012345678901234567890",
      baseURL: "http://localhost:3000/api/auth",
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: { enabled: false },
      },
      trustedOrigins: ["http://localhost:3000"],
    });
  });

  describe("signUpEmail", () => {
    it("should create a new user with valid credentials", async () => {
      const result = await auth.api.signUpEmail({
        body: {
          email: faker.internet.email().toLowerCase(),
          password: faker.internet.password({ length: 12 }),
          name: faker.person.fullName(),
        },
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it("should fail with duplicate email", async () => {
      const email = faker.internet.email().toLowerCase();
      const password = faker.internet.password({ length: 12 });
      const name = faker.person.fullName();

      await auth.api.signUpEmail({
        body: { email, password, name },
      });

      let errorCaught = false;
      try {
        await auth.api.signUpEmail({
          body: { email, password, name },
        });
      } catch (error: unknown) {
        errorCaught = true;
        const apiError = error as { status?: string };
        expect(apiError.status).toBe("UNPROCESSABLE_ENTITY");
      }
      expect(errorCaught).toBe(true);
    });

    it("should fail with short password", async () => {
      let errorCaught = false;
      try {
        await auth.api.signUpEmail({
          body: {
            email: faker.internet.email().toLowerCase(),
            password: "short",
            name: "Test",
          },
        });
      } catch (error: unknown) {
        errorCaught = true;
        expect(error).toBeDefined();
      }
      expect(errorCaught).toBe(true);
    });

    it("should fail with invalid email format", async () => {
      let errorCaught = false;
      try {
        await auth.api.signUpEmail({
          body: {
            email: "not-an-email",
            password: "ValidPassword123",
            name: "Test",
          },
        });
      } catch (error: unknown) {
        errorCaught = true;
        expect(error).toBeDefined();
      }
      expect(errorCaught).toBe(true);
    });
  });

  describe("signInEmail", () => {
    it("should authenticate valid user", async () => {
      const email = faker.internet.email().toLowerCase();
      const password = faker.internet.password({ length: 12 });
      const name = faker.person.fullName();

      await auth.api.signUpEmail({
        body: { email, password, name },
      });

      const result = await auth.api.signInEmail({
        body: { email, password },
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.token).toBeDefined();
    });

    it("should fail with invalid password", async () => {
      const email = faker.internet.email().toLowerCase();
      const password = faker.internet.password({ length: 12 });
      const name = faker.person.fullName();

      await auth.api.signUpEmail({
        body: { email, password, name },
      });

      let errorCaught = false;
      try {
        await auth.api.signInEmail({
          body: { email, password: "wrong-password" },
        });
      } catch (error: unknown) {
        errorCaught = true;
        const apiError = error as { status?: string };
        expect(apiError.status).toBe("UNAUTHORIZED");
      }
      expect(errorCaught).toBe(true);
    });

    it("should fail with non-existent user", async () => {
      let errorCaught = false;
      try {
        await auth.api.signInEmail({
          body: { email: "nonexistent@example.com", password: "password123" },
        });
      } catch (error: unknown) {
        errorCaught = true;
        const apiError = error as { status?: string };
        expect(apiError.status).toBe("UNAUTHORIZED");
      }
      expect(errorCaught).toBe(true);
    });
  });

  describe("Session Management", () => {
    it("should get session after sign-in", async () => {
      const email = faker.internet.email().toLowerCase();
      const password = faker.internet.password({ length: 12 });

      await auth.api.signUpEmail({
        body: { email, password, name: "Test User" },
      });

      const signInRes = await auth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }),
      );
      expect(signInRes.status).toBe(200);

      const setCookie = signInRes.headers.get("set-cookie");
      expect(setCookie).toBeDefined();

      const sessionRes = await auth.handler(
        new Request("http://localhost:3000/api/auth/get-session", {
          method: "GET",
          headers: { cookie: setCookie! },
        }),
      );
      expect(sessionRes.status).toBe(200);
      const sessionBody = await sessionRes.json();
      expect(sessionBody).not.toBeNull();
    });

    it("should return null for invalid session", async () => {
      const session = await auth.api.getSession({
        headers: {
          cookie: "better-auth.session_token=invalid-token",
        },
      });

      expect(session).toBeNull();
    });

    it("should sign out and invalidate session", async () => {
      const email = faker.internet.email().toLowerCase();
      const password = faker.internet.password({ length: 12 });

      await auth.api.signUpEmail({
        body: { email, password, name: "Test User" },
      });

      const signInRes = await auth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }),
      );
      expect(signInRes.status).toBe(200);

      const setCookie = signInRes.headers.get("set-cookie")!;

      const signOutRes = await auth.handler(
        new Request("http://localhost:3000/api/auth/sign-out", {
          method: "POST",
          headers: { cookie: setCookie },
        }),
      );
      expect(signOutRes.status).toBe(200);

      const sessionRes = await auth.handler(
        new Request("http://localhost:3000/api/auth/get-session", {
          method: "GET",
          headers: { cookie: setCookie },
        }),
      );
      const sessionBody = await sessionRes.json();
      expect(sessionBody).toBeNull();
    });
  });

  describe("Handler", () => {
    it("should have a handler function", () => {
      expect(typeof auth.handler).toBe("function");
    });

    it("should handle sign-up via handler", async () => {
      const email = faker.internet.email().toLowerCase();
      const request = new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "TestPassword123!",
          name: "Test User",
        }),
      });

      const response = await auth.handler(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.user.email).toBe(email);
    });

    it("should return 401 for sign-in with wrong password via handler", async () => {
      const email = faker.internet.email().toLowerCase();

      await auth.api.signUpEmail({
        body: { email, password: "CorrectPass123!", name: "Test" },
      });

      const request = new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "WrongPass123!" }),
      });

      const response = await auth.handler(request);
      expect(response.status).toBe(401);
    });

    it("should return 404 for unknown endpoint via handler", async () => {
      const request = new Request("http://localhost:3000/api/auth/nonexistent", {
        method: "GET",
      });

      const response = await auth.handler(request);
      expect(response.status).toBe(404);
    });
  });
});