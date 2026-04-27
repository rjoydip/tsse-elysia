import { describe, expect, it, beforeEach } from "bun:test";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { faker } from "@faker-js/faker";
import * as schema from "../../../src/lib/db/schema";

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
    `CREATE TABLE IF NOT EXISTS "mcp_api_key" ("id" text PRIMARY KEY, "name" text NOT NULL, "keyHash" text NOT NULL UNIQUE, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "organizationId" text, "permissions" text, "rateLimit" integer NOT NULL DEFAULT 100, "rateLimitDuration" integer NOT NULL DEFAULT 60000, "lastUsedAt" integer, "expiresAt" integer, "createdAt" integer NOT NULL, "updatedAt" integer NOT NULL)`,
  ];

  for (const sql of tables) {
    await client.execute({ sql, args: [] });
  }

  return drizzle(client, { schema });
}

describe("Authentication", () => {
  let db: ReturnType<typeof drizzle>;
  let auth: any;

  beforeEach(async () => {
    db = await createTestDatabase();
    auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
          user: schema.users,
          session: schema.sessions,
          account: schema.accounts,
          verification: schema.verifications,
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