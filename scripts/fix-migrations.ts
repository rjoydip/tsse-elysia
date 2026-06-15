import { PGlite } from "@electric-sql/pglite";
import { dbLogger } from "~/lib/logger";

const client = new PGlite();

await client.exec(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
)`);

dbLogger.log("Ensured __drizzle_migrations table exists");

/**
 * NOTE: This script is for the legacy __drizzle_migrations tracking table.
 * The current migrate.ts runner (src/lib/db/migrate.ts) applies all
 * migration files idempotently and does NOT use this table.
 *
 * Migration names updated to match current drizzle-kit generated files:
 *   0000_lively_impossible_man.sql
 *   0001_clean_mentor.sql
 *   0002_tranquil_smasher.sql
 */

const migrations = [
  ["0000", "lively_impossible_man"],
  ["0001", "clean_mentor"],
  ["0002", "tranquil_smasher"],
];

// Use INSERT ... ON CONFLICT DO NOTHING to skip existing
for (const [id, hash] of migrations) {
  const result = await client.query(
    "INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
    [Number(id), hash, Date.now()],
  );
  if (result.rows?.length) {
    dbLogger.log(`Inserted migration: ${id}`);
  } else {
    dbLogger.log(`Migration ${id} already exists, skipping`);
  }
}

const result = await client.query("SELECT * FROM __drizzle_migrations ORDER BY id");
dbLogger.log(`Current migrations: ${JSON.stringify(result.rows)}`);