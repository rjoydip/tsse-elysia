/**
 * Code Generator: Portable DSL → Drizzle Schema Files.
 *
 * Reads TableDef objects from src/lib/db/definitions/ and generates
 * both SQLite (sqliteTable) and PostgreSQL (pgTable) schema files.
 *
 * Each TableDef export becomes one file in the output dialect directory.
 * FK references between tables use lazy callbacks to resolve at runtime,
 * avoiding circular-import issues when the dependency DAG is acyclic.
 *
 * Usage: bun run ./scripts/generate-schema.ts
 */

import { readdirSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, relative, resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const DEFINITIONS_DIR = join(ROOT, "src", "lib", "db", "definitions");
const OUTPUT_SQLITE = join(ROOT, "src", "lib", "db", "schema", "sqlite");
const OUTPUT_PG = join(ROOT, "src", "lib", "db", "schema", "pg");

/**
 * Strip trailing "s" to derive a singular type name from a plural variable name.
 * e.g. "users" → "User", "subscriptionPlans" → "SubscriptionPlan"
 */
function toTypePrefix(name: string): string {
  const singular = name.endsWith("s") ? name.slice(0, -1) : name;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

/**
 * Formats a default value for code generation.
 */
function formatDefault(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "string") {
    if (val.startsWith("sql`")) return val; // raw SQL expression
    return JSON.stringify(val);
  }
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return String(val);
  return JSON.stringify(val);
}

/**
 * Generate a unique pgEnum name from table (variableName) and column key.
 */
function pgEnumName(tableKey: string, colKey: string): string {
  return `${tableKey}_${colKey}`;
}

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

function hasEnumCols(colDefs: Array<{ key: string; def: any }>): boolean {
  return colDefs.some((c) => c.def.type === "enum");
}

function hasFKCols(colDefs: Array<{ key: string; def: any }>): boolean {
  return colDefs.some((c) => c.def.references);
}

function hasTimestampCols(colDefs: Array<{ key: string; def: any }>): boolean {
  return colDefs.some((c) => c.def.type === "timestamp");
}

function hasBooleanCols(colDefs: Array<{ key: string; def: any }>): boolean {
  return colDefs.some((c) => c.def.type === "boolean");
}

function hasJsonCols(colDefs: Array<{ key: string; def: any }>): boolean {
  return colDefs.some((c) => c.def.type === "json");
}

function hasIntCols(colDefs: Array<{ key: string; def: any }>): boolean {
  return colDefs.some(
    (c) => c.def.type === "integer" || c.def.type === "timestamp" || c.def.type === "boolean",
  );
}

function hasTextCols(colDefs: Array<{ key: string; def: any }>): boolean {
  return colDefs.some(
    (c) => c.def.type === "text" || c.def.type === "uid" || c.def.type === "enum",
  );
}

function hasUniqueTableConstraint(def: any): boolean {
  return def.constraints?.unique?.length > 0;
}

// ---------------------------------------------------------------------------
// Column expression builders
// ---------------------------------------------------------------------------

/**
 * Build a single column expression for a SQLite table.
 * `refMap` maps variableName → variableName so we can write FK references.
 */
function toSqliteColumn(
  key: string,
  def: any,
  refMap: Record<string, string>,
  indent: string,
): string {
  const dbName = def.dbName ?? key;
  let expr: string;

  switch (def.type) {
    case "uid":
      expr = `text("${dbName}")`;
      break;
    case "text":
      expr = `text("${dbName}")`;
      break;
    case "enum":
      if (def.enumValues?.length) {
        const vals = def.enumValues.map((v: string) => `"${v}"`).join(", ");
        expr = `text("${dbName}", { enum: [${vals}] })`;
      } else {
        expr = `text("${dbName}")`;
      }
      break;
    case "integer":
      expr = `integer("${dbName}")`;
      break;
    case "timestamp":
      expr = `integer("${dbName}", { mode: "timestamp" })`;
      break;
    case "boolean":
      expr = `integer("${dbName}", { mode: "boolean" })`;
      break;
    case "json":
      expr = `text("${dbName}")`;
      break;
    default:
      expr = `text("${dbName}")`;
  }

  // PK
  if (def.primaryKey) {
    if (def.type === "integer" && def.autoIncrement) {
      expr += `.primaryKey({ autoIncrement: true })`;
    } else {
      expr += `.primaryKey()`;
    }
  }

  if (def.notNull) expr += `.notNull()`;
  if (def.unique) expr += `.unique()`;

  const defVal = formatDefault(def.defaultValue);
  if (defVal !== null) {
    expr += `.default(${defVal})`;
  }

  // FK reference — lazy callback resolves at runtime
  if (def.references) {
    const targetVar = refMap[def.references.table];
    if (targetVar) {
      const refCol = def.references.column;
      const opts = def.references.onDelete ? `, { onDelete: "${def.references.onDelete}" }` : "";
      expr += `.references((): AnySQLiteColumn => ${targetVar}.${refCol}${opts})`;
    }
  }

  return `${indent}${key}: ${expr},`;
}

/**
 * Build a single column expression for a PostgreSQL table.
 */
function toPgColumn(
  key: string,
  def: any,
  tableKey: string,
  refMap: Record<string, string>,
  indent: string,
): string {
  const dbName = def.dbName ?? key;
  let expr: string;

  switch (def.type) {
    case "uid":
      expr = `text("${dbName}")`;
      break;
    case "text":
      expr = `text("${dbName}")`;
      break;
    case "enum": {
      const enumName = pgEnumName(tableKey, key);
      expr = `${enumName}("${dbName}")`;
      break;
    }
    case "integer":
      expr = `integer("${dbName}")`;
      break;
    case "timestamp":
      expr = `timestamp("${dbName}")`;
      break;
    case "boolean":
      expr = `boolean("${dbName}")`;
      break;
    case "json":
      expr = `jsonb("${dbName}")`;
      break;
    default:
      expr = `text("${dbName}")`;
  }

  if (def.primaryKey) {
    if (def.type === "integer" && def.autoIncrement) {
      // For PG, serial() handles auto-increment
      expr = `serial("${def.dbName ?? key}")`;
    } else {
      expr += `.primaryKey()`;
    }
  }

  if (def.notNull) expr += `.notNull()`;
  if (def.unique) expr += `.unique()`;

  const defVal = formatDefault(def.defaultValue);
  if (defVal !== null) {
    if (def.type === "json" && typeof def.defaultValue === "string") {
      try {
        const parsed = JSON.parse(def.defaultValue);
        expr += `.default(${JSON.stringify(parsed)})`;
      } catch {
        expr += `.default(${defVal})`;
      }
    } else {
      expr += `.default(${defVal})`;
    }
  }

  if (def.references) {
    const targetVar = refMap[def.references.table];
    if (targetVar) {
      const refCol = def.references.column;
      const opts = def.references.onDelete ? `, { onDelete: "${def.references.onDelete}" }` : "";
      expr += `.references((): AnyPgColumn => ${targetVar}.${refCol}${opts})`;
    }
  }

  return `${indent}${key}: ${expr},`;
}

// ---------------------------------------------------------------------------
// File content generators
// ---------------------------------------------------------------------------

/**
 * Generate full content of a SQLite table file.
 */
function generateSqliteContent(def: any, refMap: Record<string, string>): string {
  const { variableName, tableName } = def;
  const cols: Array<{ key: string; def: any }> = Object.entries(def.columns).map(([key, val]) => ({
    key,
    def: val,
  }));
  const typePrefix = toTypePrefix(variableName);

  const stmts: string[] = [
    "/**",
    ` * Auto-generated SQLite schema for "${tableName}" table.`,
    " * DO NOT EDIT — Generated from portable DSL definition.",
    " */",
    "",
  ];

  // --- imports ---
  const coreImports: string[] = ["sqliteTable"];
  if (hasTextCols(cols) || hasEnumCols(cols)) coreImports.push("text");
  if (hasIntCols(cols)) coreImports.push("integer");
  if (hasUniqueTableConstraint(def)) coreImports.push("unique");

  stmts.push(`import { ${coreImports.join(", ")} } from "drizzle-orm/sqlite-core";`);

  if (hasFKCols(cols)) {
    stmts.push(`import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";`);
  }

  // Import referenced tables for FK lazy callbacks to compile
  const refImports = new Set<string>();
  for (const { def: col } of cols) {
    if (col.references) {
      const targetVar = refMap[col.references.table];
      if (targetVar && targetVar !== variableName) {
        refImports.add(targetVar);
      }
    }
  }
  for (const imp of [...refImports].sort()) {
    stmts.push(`import { ${imp} } from "./${imp}";`);
  }

  stmts.push("");

  // --- table definition ---
  stmts.push(`export const ${variableName} = sqliteTable("${tableName}", {`);

  for (const { key, def: col } of cols) {
    stmts.push(toSqliteColumn(key, col, refMap, "  "));
  }

  stmts.push("}");

  // Table-level unique constraints
  if (hasUniqueTableConstraint(def)) {
    stmts.push(", (table) => ({");
    for (const uc of def.constraints.unique || []) {
      const colRefs = uc.columns.map((c: string) => `table.${c}`).join(", ");
      stmts.push(`  ${uc.name || "uniqueConstraint"}: unique().on(${colRefs}),`);
    }
    stmts.push("})");
  }

  stmts.push(");\n");

  // Type exports
  stmts.push(`export type ${typePrefix}Select = typeof ${variableName}.$inferSelect;`);
  stmts.push(`export type ${typePrefix}Insert = typeof ${variableName}.$inferInsert;`);

  return stmts.join("\n") + "\n";
}

/**
 * Generate full content of a PostgreSQL table file.
 */
function generatePgContent(def: any, refMap: Record<string, string>): string {
  const { variableName, tableName } = def;
  const cols: Array<{ key: string; def: any }> = Object.entries(def.columns).map(([key, val]) => ({
    key,
    def: val,
  }));
  const typePrefix = toTypePrefix(variableName);

  const stmts: string[] = [
    "/**",
    ` * Auto-generated PostgreSQL schema for "${tableName}" table.`,
    " * DO NOT EDIT — Generated from portable DSL definition.",
    " */",
    "",
  ];

  // --- imports ---
  const coreImports: string[] = ["pgTable", "text"];
  const hasPlainInt = cols.some((c) => c.def.type === "integer" && !c.def.autoIncrement);
  const hasSerial = cols.some((c) => c.def.type === "integer" && c.def.autoIncrement);
  if (hasPlainInt) coreImports.push("integer");
  if (hasSerial) coreImports.push("serial");
  if (hasTimestampCols(cols)) coreImports.push("timestamp");
  if (hasBooleanCols(cols)) coreImports.push("boolean");
  if (hasJsonCols(cols)) coreImports.push("jsonb");
  if (hasUniqueTableConstraint(def)) coreImports.push("unique");
  if (hasEnumCols(cols)) coreImports.push("pgEnum");

  stmts.push(`import { ${coreImports.join(", ")} } from "drizzle-orm/pg-core";`);

  if (hasFKCols(cols)) {
    stmts.push(`import type { AnyPgColumn } from "drizzle-orm/pg-core";`);
  }

  // Import referenced tables
  const refImports = new Set<string>();
  for (const { def: col } of cols) {
    if (col.references) {
      const targetVar = refMap[col.references.table];
      if (targetVar && targetVar !== variableName) {
        refImports.add(targetVar);
      }
    }
  }
  for (const imp of [...refImports].sort()) {
    stmts.push(`import { ${imp} } from "./${imp}";`);
  }

  stmts.push("");

  // --- pgEnum definitions ---
  for (const { key, def: col } of cols) {
    if (col.type === "enum" && col.enumValues?.length) {
      const enumName = pgEnumName(variableName, key);
      const vals = col.enumValues.map((v: string) => `"${v}"`).join(", ");
      stmts.push(`export const ${enumName} = pgEnum("${enumName}", [${vals}]);`);
    }
  }
  if (hasEnumCols(cols)) stmts.push("");

  // --- table definition ---
  stmts.push(`export const ${variableName} = pgTable("${tableName}", {`);

  for (const { key, def: col } of cols) {
    stmts.push(toPgColumn(key, col, variableName, refMap, "  "));
  }

  stmts.push("}");

  if (hasUniqueTableConstraint(def)) {
    stmts.push(", (table) => ({");
    for (const uc of def.constraints.unique || []) {
      const colRefs = uc.columns.map((c: string) => `table.${c}`).join(", ");
      stmts.push(`  ${uc.name || "uniqueConstraint"}: unique().on(${colRefs}),`);
    }
    stmts.push("})");
  }

  stmts.push(");\n");

  stmts.push(`export type ${typePrefix}Select = typeof ${variableName}.$inferSelect;`);
  stmts.push(`export type ${typePrefix}Insert = typeof ${variableName}.$inferInsert;`);

  return stmts.join("\n") + "\n";
}

/**
 * Generate a barrel index.ts for a dialect directory.
 */
function generateBarrel(tableKeys: string[], dialect: "sqlite" | "pg"): string {
  const lines: string[] = [
    "/**",
    ` * Auto-generated barrel export for ${dialect} schema.`,
    " * DO NOT EDIT — Generated from portable DSL definitions.",
    " */",
    "",
  ];

  for (const key of tableKeys) {
    const typePrefix = toTypePrefix(key);
    lines.push(
      `export { ${key}, type ${typePrefix}Select, type ${typePrefix}Insert } from "./${key}";`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🔨 Generating dialect-specific Drizzle schema files...\n");

  for (const dir of [OUTPUT_SQLITE, OUTPUT_PG]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`  Created directory: ${relative(ROOT, dir)}`);
    }
  }

  const definitionFiles = readdirSync(DEFINITIONS_DIR)
    .filter((f) => f.endsWith(".ts") && f !== "builder.ts")
    .sort();

  if (definitionFiles.length === 0) {
    console.error("  No definition files found in src/lib/db/definitions/");
    process.exit(1);
  }

  console.log(`  Found ${definitionFiles.length} definition files\n`);

  // Phase 1: collect all TableDef objects and build the ref-map
  const tableDefs: Array<Record<string, any>> = [];
  const refMap: Record<string, string> = {};

  for (const file of definitionFiles) {
    const filePath = join(DEFINITIONS_DIR, file);
    const mod = await import(filePath);

    for (const [, value] of Object.entries(mod)) {
      if (
        value &&
        typeof value === "object" &&
        "variableName" in (value as Record<string, unknown>) &&
        "tableName" in (value as Record<string, unknown>) &&
        "columns" in (value as Record<string, unknown>)
      ) {
        const tableDef = value as Record<string, any>;
        tableDefs.push(tableDef);
        refMap[tableDef.variableName] = tableDef.variableName;
      }
    }
  }

  console.log(`  Total tables: ${tableDefs.length}\n`);

  const tableKeys = tableDefs.map((d) => d.variableName as string);

  // Phase 2: generate SQLite files
  console.log("  Generating SQLite schema files ...");
  for (const def of tableDefs) {
    const content = generateSqliteContent(def, refMap);
    const fp = join(OUTPUT_SQLITE, `${def.variableName}.ts`);
    writeFileSync(fp, content);
    console.log(`    ✓ ${def.variableName}.ts`);
  }

  // Phase 3: generate PostgreSQL files
  console.log("\n  Generating PostgreSQL schema files ...");
  for (const def of tableDefs) {
    const content = generatePgContent(def, refMap);
    const fp = join(OUTPUT_PG, `${def.variableName}.ts`);
    writeFileSync(fp, content);
    console.log(`    ✓ ${def.variableName}.ts`);
  }

  // Phase 4: barrel exports
  console.log("\n  Generating barrel exports ...");
  writeFileSync(join(OUTPUT_SQLITE, "index.ts"), generateBarrel(tableKeys, "sqlite"));
  writeFileSync(join(OUTPUT_PG, "index.ts"), generateBarrel(tableKeys, "pg"));
  console.log("    ✓ sqlite/index.ts");
  console.log("    ✓ pg/index.ts");

  console.log("\n✅ Schema generation complete!");
  console.log(`   SQLite: ${relative(ROOT, OUTPUT_SQLITE)}/`);
  console.log(`   PG:     ${relative(ROOT, OUTPUT_PG)}/`);
}

main().catch((err) => {
  console.error("Schema generation failed:", err);
  process.exit(1);
});