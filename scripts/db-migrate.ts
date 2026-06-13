#!/usr/bin/env bun

/**
 * PGlite-aware migration runner.
 *
 * Detects which database driver is active and applies migrations accordingly:
 * - PGlite (WASM in-process) → applies SQL files via PGlite.exec()
 * - node-postgres / neon / pg-proxy → delegates to drizzle-kit migrate
 *
 * drizzle-kit migrate requires a real PostgreSQL server (TCP connection).
 * PGlite runs in-process (WASM) and is unreachable via TCP, so it needs
 * a different approach.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

async function run(): Promise<void> {
  // Check if we have a real PG server connection string
  const hasRealPg = !!(process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL);

  if (hasRealPg) {
    // Real PostgreSQL — use drizzle-kit migrate
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("bun", ["x", "drizzle-kit", "migrate"], {
      stdio: "inherit",
      cwd: resolve(import.meta.dir, ".."),
    });
    process.exit(result.status ?? 1);
    return;
  }

  // PGlite — apply migrations directly
  const { initializeDatabase, getDatabasePools } = await import("~/config/db");
  await initializeDatabase();
  const pools = getDatabasePools();
  const client = pools.client as { exec(sql: string): Promise<unknown> } | undefined;

  if (!client || typeof client.exec !== "function") {
    console.error("No database client available for migration");
    process.exit(1);
  }

  const migrationsDir = resolve(import.meta.dir, "../drizzle");
  if (!existsSync(migrationsDir)) {
    console.error("No migrations directory found at", migrationsDir);
    process.exit(1);
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found");
    return;
  }

  console.log(`Running ${files.length} migration(s) via PGlite...`);

  for (const file of files) {
    const filePath = resolve(migrationsDir, file);
    const sql = readFileSync(filePath, "utf-8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`  ${file} (${statements.length} statements)`);

    for (let stmt of statements) {
      try {
        // Wrap CREATE TYPE in DO blocks for idempotency
        stmt = stmt.replace(
          /^(CREATE\s+TYPE\s+.+?;)$/gm,
          (match) => `DO $$ BEGIN\n  ${match}\nEXCEPTION WHEN duplicate_object THEN null;\nEND $$;`,
        );
        stmt = stmt.replace(/^CREATE\s+TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
        stmt = stmt.replace(
          /^ALTER\s+TABLE\s+\S+\s+ADD\s+CONSTRAINT\s+"([^"]+)".*;$/gm,
          (match, conName) =>
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${conName}') THEN ${match} END IF; END $$;`,
        );
        await client.exec(stmt);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        // Log but don't fail — PGlite may reject some PG-specific syntax
        console.log(`    ⚠ ${msg.slice(0, 80)}`);
      }
    }
  }

  console.log("Migration complete");
  process.exit(0);
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});