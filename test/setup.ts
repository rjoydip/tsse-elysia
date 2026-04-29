import { afterEach } from "bun:test";
import { initializeDatabase, getDatabasePools } from "~/config/db";

export async function setup() {
  // Ensure the database is initialized (it might already be via module side-effect,
  // but this ensures we have an awaited trigger if needed).
  initializeDatabase();

  const pools = getDatabasePools();

  // Verify that the required database (sqlite or pg) is ready.
  // In the test environment, we expect sqlite.
  if (!pools.sqlite && !pools.primary) {
    throw new Error("Database failed to initialize for tests");
  }
}

// If on Node/Bun, attempt to hint memory management
if (global.gc) {
  afterEach(() => {
    global.gc!();
  });
}

await setup();