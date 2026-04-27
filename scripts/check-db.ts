import { createClient } from "@libsql/client";

const client = createClient({
  url: "file:.artifacts/tsse-elysia.db",
});

try {
  const result = await client.execute("SELECT * FROM __drizzle_migrations");
  console.log("Migrations table:", JSON.stringify(result.rows));
} catch (e) {
  console.log("Error:", e);
}

const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
console.log("Tables:", JSON.stringify(tables.rows, null, 2));