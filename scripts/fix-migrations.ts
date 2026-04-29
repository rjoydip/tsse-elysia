import { createClient } from "@libsql/client";

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

console.log("Created __drizzle_migrations table");

const migrations = [
  ["0000", "init"],
  ["0001", "melted_ego"],
  ["0002", "premium_micromax"],
  ["0003", "known_jackal"],
  ["0004", "true_warstar"],
];

for (const [id, hash] of migrations) {
  await client.execute({
    sql: `INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (?, ?, ?)`,
    args: [id, hash, Date.now()],
  });
}

const result = await client.execute("SELECT * FROM __drizzle_migrations");
console.log("Inserted migrations:", JSON.stringify(result.rows));