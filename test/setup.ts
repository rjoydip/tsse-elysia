import { afterEach } from "bun:test";
import { initializeDatabase, getDatabasePools, getWriteDb } from "~/config/db";

export async function setup() {
  // Set environment variables for test database
  process.env.DATABASE_TYPE = "sqlite";
  process.env.SQLITE_URL = ":memory:";

  // Initialize database connection
  await initializeDatabase();

  const pools = getDatabasePools();

  // Verify that the required database (sqlite or pg) is ready.
  // In the test environment, we expect sqlite.
  if (!pools.sqlite && !pools.primary) {
    throw new Error("Database failed to initialize for tests");
  }

  // Create tables manually for in-memory SQLite
  const db = getWriteDb();
  try {
    // Create user_settings_account table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_settings_account (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        dob INTEGER,
        language TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);

    // Create user_settings_display table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_settings_display (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        items TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);

    // Create user_settings_notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_settings_notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        mobile INTEGER NOT NULL,
        communicationEmails INTEGER NOT NULL,
        socialEmails INTEGER NOT NULL,
        marketingEmails INTEGER NOT NULL,
        securityEmails INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);
  } catch (error) {
    console.warn("Failed to create tables for tests:", error);
  }
}

// If on Node/Bun, attempt to hint memory management
if (global.gc) {
  afterEach(() => {
    global.gc!();
  });
}

await setup();