import { PGlite } from "@electric-sql/pglite";
import { dbLogger } from "~/lib/logger";

const client = new PGlite();

try {
  const result = await client.query("SELECT * FROM __drizzle_migrations");
  dbLogger.log(`Migrations table: ${JSON.stringify(result.rows)}`);
} catch (e) {
  dbLogger.log(`Error: ${e}`);
}

const tables = await client.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
);
dbLogger.log(`Tables: ${JSON.stringify(tables.rows, null, 2)}`);