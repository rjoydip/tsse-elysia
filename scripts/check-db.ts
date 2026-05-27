import { createClient } from "@libsql/client";
import { dbLogger } from "~/lib/logger";

const client = createClient({
  url: "file:.artifacts/tsse-elysia.db",
});

try {
  const result = await client.execute("SELECT * FROM __drizzle_migrations");
  dbLogger.log(`Migrations table: ${JSON.stringify(result.rows)}`);
} catch (e) {
  dbLogger.log(`Error: ${e}`);
}

const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
dbLogger.log(`Tables: ${JSON.stringify(tables.rows, null, 2)}`);