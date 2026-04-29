/**
 * Test cleanup utilities for database cleanup after tests.
 * Uses Node.js SQLite driver to avoid bun: protocol issues in Playwright teardown.
 */
import { eq, like } from "drizzle-orm";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/core/schema";
import { logger } from "../src/lib/logger";

/**
 * Prefix used to identify test users/emails.
 */
const TEST_PREFIX = "test-";

/**
 * Domain used for test emails.
 */
const TEST_DOMAIN = "example.com";

/**
 * Database URL from environment or default file path.
 */
const sqliteUrl = process.env.SQLITE_URL || "file:.artifacts/tsse-elysia.db";

/**
 * Creates a connection to the SQLite database.
 */
function createDbConnection() {
  const client = createClient({
    url: sqliteUrl,
  });
  return drizzle(client, { schema });
}

/**
 * Cleanup a specific test user by email.
 * Deletes all related data in the correct order (respects foreign keys).
 *
 * @param email - Email of the user to clean up
 */
export async function cleanupTestUser(email: string): Promise<void> {
  const db = createDbConnection();
  try {
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (users.length === 0) {
      logger.log(`[E2E Cleanup] User ${email} not found, skipping`);
      return;
    }

    const user = users[0];

    await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
    await db.delete(schema.accounts).where(eq(schema.accounts.userId, user.id));
    await db.delete(schema.verifications).where(eq(schema.verifications.identifier, user.email));
    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, user.id));
    await db.delete(schema.mcpApiKeys).where(eq(schema.mcpApiKeys.userId, user.id));
    await db.delete(schema.users).where(eq(schema.users.id, user.id));

    logger.log(`[E2E Cleanup] Successfully deleted user: ${email}`);
  } catch (error) {
    logger.warn(`[E2E Cleanup] Failed to clean up user ${email}`, error);
  }
}

/**
 * Cleanup all test users (users with test- prefix in email).
 * Used for E2E teardown.
 */
export async function cleanupAllTestData(): Promise<void> {
  const db = createDbConnection();
  try {
    const testUsers = await db
      .select()
      .from(schema.users)
      .where(like(schema.users.email, `${TEST_PREFIX}%`));

    if (testUsers.length === 0) {
      logger.log("[E2E Cleanup] No test users found to clean up");
      return;
    }

    logger.log(`[E2E Cleanup] Found ${testUsers.length} test users to clean up`);

    for (const user of testUsers) {
      try {
        await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
        await db.delete(schema.accounts).where(eq(schema.accounts.userId, user.id));
        await db
          .delete(schema.verifications)
          .where(eq(schema.verifications.identifier, user.email));
        await db.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, user.id));
        await db.delete(schema.mcpApiKeys).where(eq(schema.mcpApiKeys.userId, user.id));
        await db.delete(schema.users).where(eq(schema.users.id, user.id));
        logger.log(`[E2E Cleanup] Deleted user: ${user.email}`);
      } catch (error) {
        logger.warn(`[E2E Cleanup] Failed to delete user ${user.email}`, error);
      }
    }

    logger.log("[E2E Cleanup] All test data cleaned up successfully");
  } catch (error) {
    logger.error("[E2E Cleanup] Failed to clean up test data:", error);
  }
}

/**
 * Generate a unique test email with timestamp.
 */
export function generateTestEmail(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@${TEST_DOMAIN}`;
}

/**
 * Check if an email is a test email.
 */
export function isTestEmail(email: string): boolean {
  return email.startsWith(TEST_PREFIX) && email.endsWith(`@${TEST_DOMAIN}`);
}

export default async function Teardown() {
  logger.log("[Teardown] Starting cleanup...");

  try {
    await cleanupAllTestData();
    logger.log("[Teardown] Cleanup completed successfully");
  } catch (error) {
    logger.error("[Teardown] Cleanup failed", error);
  }
}