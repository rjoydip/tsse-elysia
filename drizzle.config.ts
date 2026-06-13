import { defineConfig } from "drizzle-kit";
import { fdir } from "fdir";

const postgresUrl =
  process.env.POSTGRES_URL ||
  `postgresql://${process.env.POSTGRES_USER || "tsse"}:${
    process.env.POSTGRES_PASSWORD || ""
  }@${process.env.POSTGRES_HOST || "localhost"}:${
    process.env.POSTGRES_PORT || 5432
  }/${process.env.POSTGRES_DB || "tsse_dev"}`;

const schemas = new fdir()
  .withBasePath()
  .glob("./src/lib/db/*.ts")
  // Exclude non-table files
  .filter(
    (p) =>
      !p.endsWith("index.ts") &&
      !p.endsWith("types.ts") &&
      !p.endsWith("relations.ts") &&
      !p.endsWith("schema.ts") &&
      !p.endsWith("definitions/builder.ts"),
  )
  .crawl()
  .sync()
  .filter((p) => !p.endsWith("index.ts"))
  .map((p) => `./${p.replaceAll("\\", "/")}`);

export default defineConfig({
  schema: schemas,
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: postgresUrl,
  },
});