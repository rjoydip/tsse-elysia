import { defineConfig } from "drizzle-kit";
import { fdir } from "fdir";

const dbType = process.env.DATABASE_TYPE || "sqlite";
const sqliteDbUrl = process.env.SQLITE_URL || "file:.artifacts/tsse-elysia.db";

const postgresUrl =
  process.env.POSTGRES_URL ||
  `postgresql://${process.env.POSTGRES_USER || "tsse"}:${
    process.env.POSTGRES_PASSWORD || ""
  }@${process.env.POSTGRES_HOST || "localhost"}:${
    process.env.POSTGRES_PORT || 5432
  }/${process.env.POSTGRES_DB || "tsse_dev"}`;

const schemas = new fdir()
  .withBasePath()
  .withDirs()
  .glob("./src/lib/db/schema/*.ts")
  .crawl()
  .sync()
  .filter((p) => !p.endsWith("index.ts"))
  .map((p) => `./${p.replaceAll("\\", "/")}`);

export default defineConfig({
  schema: schemas,
  out: "./drizzle",
  dialect: dbType === "postgres" ? "postgresql" : "sqlite",
  dbCredentials: {
    url: dbType === "postgres" ? postgresUrl : sqliteDbUrl,
  },
});