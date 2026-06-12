/**
 * Portable database schema DSL (Domain-Specific Language).
 * Provides dialect-agnostic column type definitions used as a single source of truth
 * for generating both SQLite and PostgreSQL Drizzle schema files.
 */

/**
 * Supported portable column types.
 */
export type ColumnType = "uid" | "text" | "integer" | "timestamp" | "boolean" | "enum" | "json";

/**
 * Foreign key reference definition.
 */
export interface ReferenceDef {
  /** Target table variable name (e.g., "users") */
  table: string;
  /** Target column name (e.g., "id") */
  column: string;
  /** ON DELETE action */
  onDelete?: "cascade" | "set null" | "set default" | "restrict" | "no action";
}

/**
 * Portable column definition — used as input for the code generator.
 */
export interface ColumnDef {
  /** Column type */
  type: ColumnType;
  /** ISO string representation of default value for serialization */
  defaultValue?: unknown;
  /** Override database column name (defaults to camelCase TS key) */
  dbName?: string;
  /** NOT NULL constraint */
  notNull?: boolean;
  /** UNIQUE constraint */
  unique?: boolean;
  /** Column is primary key */
  primaryKey?: boolean;
  /** Auto-increment (for integer PKs) */
  autoIncrement?: boolean;
  /** Enum values (only for type: "enum") */
  enumValues?: readonly string[];
  /** Foreign key reference */
  references?: ReferenceDef;
}

/**
 * Unique constraint definition.
 */
export interface UniqueConstraint {
  /** Column names that form the unique constraint */
  columns: string[];
}

/**
 * Portable table definition.
 */
export interface TableDef {
  /** Variable name used in generated exports (e.g., "users") */
  variableName: string;
  /** Database table name (e.g., "user") */
  tableName: string;
  /** Column definitions keyed by TypeScript property name */
  columns: Record<string, ColumnDef>;
  /** Table-level constraints */
  constraints?: {
    unique?: UniqueConstraint[];
  };
}

/**
 * Helper to create a UID column (text primary key).
 */
export function uid(): ColumnDef {
  return { type: "uid", primaryKey: true };
}

/**
 * Helper to create a text column.
 */
export function text(): ColumnDef {
  return { type: "text" };
}

/**
 * Helper to create an integer column.
 */
export function integer(): ColumnDef {
  return { type: "integer" };
}

/**
 * Helper to create a timestamp column.
 * In SQLite: integer with mode "timestamp"
 * In PostgreSQL: timestamp type
 */
export function timestamp(): ColumnDef {
  return { type: "timestamp" };
}

/**
 * Helper to create a boolean column.
 * In SQLite: integer with mode "boolean"
 * In PostgreSQL: boolean type
 */
export function boolean(): ColumnDef {
  return { type: "boolean", defaultValue: false };
}

/**
 * Helper to create an enum column.
 * In SQLite: text with enum constraint
 * In PostgreSQL: pgEnum + column
 */
export function enum_<T extends string>(
  values: readonly T[],
): ColumnDef & { enumValues: readonly T[] } {
  return { type: "enum", enumValues: values };
}

/**
 * Helper to create a JSON column.
 * In SQLite: text (JSON string)
 * In PostgreSQL: jsonb
 */
export function json(): ColumnDef {
  return { type: "json" };
}

/**
 * Defines a table with portable column definitions.
 * This is the single source of truth for schema definitions.
 * The code generator reads these and produces dialect-specific Drizzle schema files.
 *
 * @param variableName - The export variable name (e.g., "users")
 * @param tableName - The database table name (e.g., "user")
 * @param columns - Column definitions keyed by TypeScript property name
 * @param constraints - Optional table-level constraints
 * @returns A portable TableDef object
 */
export function defineTable(
  variableName: string,
  tableName: string,
  columns: Record<string, ColumnDef>,
  constraints?: { unique?: UniqueConstraint[] },
): TableDef {
  const resolved: Record<string, ColumnDef> = {};

  for (const [key, col] of Object.entries(columns)) {
    resolved[key] = { ...col, dbName: col.dbName ?? key };
  }

  return {
    variableName,
    tableName,
    columns: resolved,
    constraints,
  };
}

/**
 * Type helper to extract the select type from a TableDef.
 * This allows services/repos to reference types without depending on generated schema.
 */
export type InferSelectType<T extends TableDef> = {
  [K in keyof T["columns"]]: T["columns"][K] extends { type: "uid" | "text" }
    ? string
    : T["columns"][K] extends { type: "integer" }
      ? number
      : T["columns"][K] extends { type: "timestamp" }
        ? Date
        : T["columns"][K] extends { type: "boolean" }
          ? boolean
          : T["columns"][K] extends { type: "json" }
            ? string
            : T["columns"][K] extends { type: "enum"; enumValues: readonly (infer U)[] }
              ? U
              : never;
};