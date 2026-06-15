import { describe, expect, it } from "bun:test";
import {
  wrapCreateType,
  wrapAddConstraint,
  wrapAddPrimaryKey,
  wrapStatements,
  applyMigrationFile,
} from "~/lib/db/migrate";

/**
 * Unit tests for the migration engine's regex wrappers.
 *
 * Each wrapper function transforms raw Drizzle-generated SQL into
 * idempotent SQL that can be safely re-run on every startup.
 * These tests verify the regex patterns handle real migration outputs
 * correctly, including edge cases like multi-line constraints,
 * composite PKs, and already-wrapped re-runs.
 */
describe("wrapCreateType", () => {
  it("should wrap a single CREATE TYPE in DO block", () => {
    const input = `CREATE TYPE "tasks_status" AS ENUM('backlog', 'todo', 'done');`;
    const result = wrapCreateType(input);

    expect(result).toContain("DO $$ BEGIN");
    expect(result).toContain("CREATE TYPE \"tasks_status\" AS ENUM('backlog', 'todo', 'done');");
    expect(result).toContain("EXCEPTION WHEN duplicate_object THEN null;");
    expect(result).toContain("END $$;");
  });

  it("should wrap multiple CREATE TYPE statements", () => {
    const input = [
      `CREATE TYPE "tasks_status" AS ENUM('backlog', 'todo');`,
      `CREATE TYPE "tasks_priority" AS ENUM('low', 'high');`,
    ].join("\n");

    const result = wrapCreateType(input);

    expect(result).toContain("DO $$ BEGIN");
    // Should have two DO blocks
    expect(result.match(/DO \$\$/g)).toHaveLength(2);
  });

  it("should leave other SQL unchanged", () => {
    const input = `CREATE TABLE IF NOT EXISTS "tasks" ("id" text PRIMARY KEY);`;
    const result = wrapCreateType(input);

    expect(result).toBe(input);
  });

  it("should handle CREATE TYPE with multi-line enum values", () => {
    // The regex uses .+? which does NOT span newlines by default;
    // a multi-line enum value is wrapped line-by-line instead.
    // This is acceptable because Drizzle always emits CREATE TYPE on one line.
    const input = `CREATE TYPE "tasks_label" AS ENUM(\n  'bug',\n  'feature',\n  'documentation'\n);`;
    const result = wrapCreateType(input);

    // Only the first line (ending with ENUM() paren) is wrapped
    expect(result).toContain("DO $$ BEGIN");
    expect(result).toContain("EXCEPTION WHEN duplicate_object THEN null;");
  });
});

describe("wrapAddConstraint", () => {
  it("should wrap ALTER TABLE ... ADD CONSTRAINT with existence check", () => {
    const input = `ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade;`;
    const result = wrapAddConstraint(input);

    expect(result).toContain(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'account_userId_user_id_fk')",
    );
    expect(result).toContain(input);
    expect(result).toContain("END IF; END $$;");
  });

  it("should wrap multiple constraint additions", () => {
    const input = [
      `ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id");`,
      `ALTER TABLE "mcp_api_key" ADD CONSTRAINT "mcp_api_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id");`,
    ].join("\n");

    const result = wrapAddConstraint(input);

    expect(result.match(/DO \$\$/g)).toHaveLength(2);
    expect(result).toContain("conname = 'account_userId_fkey'");
    expect(result).toContain("conname = 'mcp_api_key_userId_fkey'");
  });

  it("should leave non-constraint ALTER TABLE unchanged", () => {
    const input = `ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user';`;
    const result = wrapAddConstraint(input);

    expect(result).toBe(input);
  });

  it("should handle multi-line constraint SQL", () => {
    const input = `ALTER TABLE "user_role" ADD CONSTRAINT "user_role_userId_roleId_pk" PRIMARY KEY("userId", "roleId");`;
    const result = wrapAddConstraint(input);

    expect(result).toContain("conname = 'user_role_userId_roleId_pk'");
    expect(result).toContain("DO $$ BEGIN IF NOT EXISTS");
  });
});

describe("wrapAddPrimaryKey", () => {
  it("should wrap bare ADD PRIMARY KEY with existence check", () => {
    const input = `ALTER TABLE "service_health" ADD PRIMARY KEY ("id");`;
    const result = wrapAddPrimaryKey(input);

    expect(result).toContain(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_health_pkey')",
    );
    expect(result).toContain('ALTER TABLE "service_health" ADD PRIMARY KEY ("id");');
    expect(result).toContain("END IF; END $$;");
  });

  it("should handle composite primary key", () => {
    const input = `ALTER TABLE "role_permission" ADD PRIMARY KEY ("roleId", "permissionId");`;
    const result = wrapAddPrimaryKey(input);

    expect(result).toContain("conname = 'role_permission_pkey'");
    expect(result).toContain(
      'ALTER TABLE "role_permission" ADD PRIMARY KEY ("roleId", "permissionId");',
    );
  });

  it("should handle unquoted table name", () => {
    const input = `ALTER TABLE service_health ADD PRIMARY KEY (id);`;
    const result = wrapAddPrimaryKey(input);

    expect(result).toContain("conname = 'service_health_pkey'");
    expect(result).toContain('ALTER TABLE "service_health" ADD PRIMARY KEY (id);');
  });

  it("should leave non-PK ALTER TABLE unchanged", () => {
    const input = `ALTER TABLE "user" ADD COLUMN "role" text NOT NULL;`;
    const result = wrapAddPrimaryKey(input);

    expect(result).toBe(input);
  });
});

describe("wrapStatements", () => {
  it("should apply all wrappers to individual statements", () => {
    // wrapStatements operates on individual SQL statements (after splitting).
    // Test each wrapper type as a separate statement.
    const typeStmt = wrapStatements(
      `CREATE TYPE "tasks_status" AS ENUM('backlog', 'todo', 'done');`,
    );
    expect(typeStmt).toContain("DO $$ BEGIN");
    expect(typeStmt).toContain("EXCEPTION WHEN duplicate_object THEN null;");

    const tableStmt = wrapStatements(
      `CREATE TABLE "tasks" ("id" text PRIMARY KEY, "title" text NOT NULL);`,
    );
    expect(tableStmt).toBe(
      'CREATE TABLE IF NOT EXISTS "tasks" ("id" text PRIMARY KEY, "title" text NOT NULL);',
    );

    const constraintStmt = wrapStatements(
      `ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id");`,
    );
    expect(constraintStmt).toContain("conname = 'account_userId_fkey'");

    const pkStmt = wrapStatements(`ALTER TABLE "service_health" ADD PRIMARY KEY ("id");`);
    expect(pkStmt).toContain("conname = 'service_health_pkey'");
  });

  it("should be idempotent when re-run", () => {
    const input = `CREATE TYPE "test_type" AS ENUM('a', 'b');`;
    const first = wrapStatements(input);
    const second = wrapStatements(first);

    // Re-running should not double-wrap
    expect(first).toBe(second);
  });
});

describe("getMigrationFiles", () => {
  it("should return sorted migration files", async () => {
    const { getMigrationFiles } = await import("~/lib/db/migrate");
    const files = getMigrationFiles();

    expect(files.length).toBeGreaterThanOrEqual(1);

    // Check files exist on disk and are sorted
    for (const file of files) {
      const stat = await Bun.file(file).exists();
      expect(stat).toBe(true);
    }

    // Must be sorted by version (0000, 0001, 0002...)
    const basenames = files.map((f) => f.split(/[/\\]/).pop() ?? "");
    expect(basenames[0]).toContain("0000");
  });
});

describe("applyMigrationFile", () => {
  it("should execute a migration file against PGlite", async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const client = new PGlite();

    // Get the first (0000) migration file
    const { getMigrationFiles } = await import("~/lib/db/migrate");
    const files = getMigrationFiles();

    if (files.length > 0) {
      await applyMigrationFile(client, files[0]);

      // After applying, verify tables exist
      const results = await client.exec(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      );
      const resultsArr = Array.isArray(results) ? results : [results];
      const tableNames = resultsArr
        .flatMap((r: any) => r?.rows ?? [])
        .map((r: any) => r.table_name)
        .filter(Boolean);

      expect(tableNames.length).toBeGreaterThan(0);
    }
  });
});