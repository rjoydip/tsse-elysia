import { createClient } from "@libsql/client";
import { dbLogger } from "~/lib/logger";

const client = createClient({
  url: "file:.artifacts/tsse-elysia.db",
});

await client.execute({
  sql: `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY,
    hash TEXT NOT NULL,
    created_at BIGINT NOT NULL
  )`,
  args: [],
});

dbLogger.log("Ensured __drizzle_migrations table exists");

const migrations = [
  ["0000", "init"],
  ["0001", "melted_ego"],
  ["0002", "premium_micromax"],
  ["0003", "known_jackal"],
  ["0004", "true_warstar"],
];

// Use INSERT OR IGNORE to skip existing
for (const [id, hash] of migrations) {
  const result = await client.execute({
    sql: `INSERT OR IGNORE INTO __drizzle_migrations (id, hash, created_at) VALUES (?, ?, ?)`,
    args: [Number(id), hash, Date.now()],
  });
  if (result.rowsAffected && result.rowsAffected > 0) {
    dbLogger.log(`Inserted migration: ${id}`);
  } else {
    dbLogger.log(`Migration ${id} already exists, skipping`);
  }
}

const result = await client.execute("SELECT * FROM __drizzle_migrations ORDER BY id");
dbLogger.log(`Current migrations: ${JSON.stringify(result.rows)}`);