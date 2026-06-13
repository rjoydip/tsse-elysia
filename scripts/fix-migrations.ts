import { PGlite } from "@electric-sql/pglite";
import { dbLogger } from "~/lib/logger";

const client = new PGlite();

await client.exec(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
)`);

dbLogger.log("Ensured __drizzle_migrations table exists");

const migrations = [
  ["0000", "init"],
  ["0001", "melted_ego"],
  ["0002", "premium_micromax"],
  ["0003", "known_jackal"],
  ["0004", "true_warstar"],
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