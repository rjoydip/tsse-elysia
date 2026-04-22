/**
 * Isomorphic environment variable fetching with type-safe validation.
 * Provides a unified API for accessing env vars across server/client boundaries.
 * Prevents server-only secrets from leaking to client-side code.
 *
 * @example
 * // Server-side: full access to all variables
 * const dbUrl = env.SQLITE_URL;
 *
 * // Client-side: only client vars accessible
 * const apiUrl = env.VITE_API_URL;
 */

import { t, getSchemaValidator, type TSchema } from "elysia";
import { randomUUID } from "uncrypto";
import { createError } from "evlog";
import { isBun, isNode, isProduction, PORT, HOST, PROTOCAL } from ".";
import { logger } from "../lib/logger";

/**
 * Configuration options for environment validation.
 * @interface EnvOptions
 * @property server - Schema for server-only environment variables
 * @property client - Schema for client-safe environment variables (exposed to browser)
 * @property shared - Schema for variables available in both contexts
 * @property emptyStringAsUndefined - Treat empty strings as undefined
 * @property skipValidation - Skip schema validation entirely
 * @property extends - Additional schema presets to merge
 * @property isServer - Override server detection
 * @property onValidationError - Custom handler for validation failures
 * @property onInvalidAccess - Custom handler for accessing server-only vars on client
 * @property runtimeEnv - Custom function to provide runtime environment
 * @example
 * // Define custom env schema
 * const customEnv = await _createEnv({
 *   client: { MY_VAR: t.String() },
 *   server: { SECRET: t.String() },
 *   runtimeEnv: () => ({ MY_VAR: "value", SECRET: "secret" })
 * });
 */
interface EnvOptions {
  server?: Record<string, TSchema>;
  client?: Record<string, TSchema>;
  shared?: Record<string, TSchema>;
  emptyStringAsUndefined?: boolean;
  skipValidation?: boolean;
  extends?: Record<string, any>[];
  isServer?: boolean;
  onValidationError?: (errors: any) => never;
  onInvalidAccess?: (prop: string) => never;
  runtimeEnv?: () => Record<string, string | number | boolean | undefined>;
}

/**
 * Creates a validated environment object with server/client boundary enforcement.
 * Uses a Proxy to intercept access and prevent server-only vars from leaking.
 *
 * @param opts - Configuration options for environment validation
 * @returns Proxy-wrapped environment object with type safety
 */
async function _createEnv(opts: EnvOptions) {
  // Get runtime environment from provider function or use runtime-specific env
  const _runtimeEnv = typeof opts.runtimeEnv === "function" ? opts.runtimeEnv() : opts.runtimeEnv;
  const runtimeEnv = _runtimeEnv ?? (isBun ? Bun.env : isNode ? process.env : {});

  // Optional: convert empty strings to undefined for cleaner validation
  const emptyStringAsUndefined = opts.emptyStringAsUndefined ?? false;
  if (emptyStringAsUndefined) {
    for (const [key, value] of Object.entries(runtimeEnv)) {
      if (value === "") {
        delete runtimeEnv[key];
      }
    }
  }

  // Skip validation if requested - useful for development or partial configs
  const skip = !!opts.skipValidation;
  if (skip) {
    if (opts.extends) {
      for (const preset of opts.extends) {
        preset.skipValidation = true;
      }
    }

    return runtimeEnv as any;
  }

  // Parse and validate schema types
  const client = typeof opts.client === "object" ? opts.client : {};
  const server = typeof opts.server === "object" ? opts.server : {};
  const shared = typeof opts.shared === "object" ? opts.shared : {};

  // Determine if running on server - needed for access control decisions
  const isTest = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
  const isServer = opts.isServer ?? (typeof window === "undefined" || isTest);

  // Build final schema shape based on context (server gets all, client gets subset)
  const finalSchemaShape = isServer
    ? {
        ...server,
        ...shared,
        ...client,
      }
    : {
        ...client,
        ...shared,
      };

  // Validate environment against schema using Elysia's validator
  const schema = getSchemaValidator(t.Object(finalSchemaShape), runtimeEnv);

  // Handle validation failures - throw with error details
  if (!schema.Check) {
    const onValidationError =
      opts.onValidationError ??
      ((errors: any) => {
        logger.error(`Invalid environment variables: ${JSON.stringify(errors)}`);
        throw createError({
          message: "Invalid environment variables",
          status: 500,
          why: "Environment validation failed",
          fix: "Check your environment configuration",
        });
      });
    onValidationError(schema.Errors);
  }

  // Handler for invalid access attempts (server-only var on client)
  const onInvalidAccess =
    opts.onInvalidAccess ??
    ((prop: string) => {
      throw createError({
        message: `Attempted to access a server-side environment variable "${prop}" on the client`,
        status: 403,
        why: "Client-side code cannot access server-only variables",
        fix: "Remove server-only env var access from client code",
      });
    });

  // Access control predicates - determine if access is allowed
  const isServerAccess = (prop: string) => {
    return !(prop in client) && !(prop in shared);
  };
  const isValidServerAccess = (prop: string) => {
    return isServer || !isServerAccess(prop);
  };

  // Skip these special properties to avoid Proxy edge cases
  const ignoreServerProp = (prop: string) => prop === "__esModule" || prop === "$$typeof";
  const ignoreClientProp = (prop: string) => prop === "then";

  // Merge extended presets with runtime environment
  const extendedObj = (opts.extends ?? []).reduce((acc: any, curr: any) => {
    return Object.assign(acc, curr);
  }, {});
  const fullObj = Object.assign(extendedObj, runtimeEnv);

  // Create Proxy-wrapped environment with access control
  // This prevents accidental server-only var leaks to client
  const env = new Proxy(fullObj, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (ignoreServerProp(prop)) return undefined;
      if (ignoreClientProp(prop)) return undefined;
      if (!isValidServerAccess(prop)) return onInvalidAccess(prop);
      return Reflect.get(target, prop);
    },
  });

  return env as Record<string, string | number | undefined>;
}

/**
 * Retrieves an environment variable with fallback to default value.
 * Works across Bun, Node.js, and browser environments.
 *
 * @param key - Environment variable name
 * @param defaultValue - Fallback value if key is not set
 * @returns The environment value or default
 */
const _getEnv = (key: string, defaultValue: string = ""): string => {
  const value = isBun ? Bun.env[key] : isNode ? process.env?.[key] : undefined;
  return value ?? defaultValue;
};

/**
 * Default configuration values for local development.
 * These are used when environment variables are not explicitly set.
 * Uses VALUES from config/index.ts for consistency.
 * @example
 * // Default: http://localhost:3000
 * // Custom: Set HOST, PORT, PROTOCAL env vars
 */
const _BASE_URL = `${PROTOCAL}://${HOST}:${PORT}`;

/**
 * Retrieves and validates the Better Auth secret key.
 * In production, this is required. In development, generates a temporary one.
 *
 * @returns The authentication secret for session encryption
 * @throws Error if secret is missing in production environment
 */
function _getAuthSecret(): string {
  const secret = _getEnv("BETTER_AUTH_SECRET", "");
  if (!secret) {
    if (isProduction) {
      // Production requires a stable secret for session persistence
      throw createError({
        message: "BETTER_AUTH_SECRET is required in production",
        status: 500,
        why: "Production requires a stable auth secret",
        fix: "Set BETTER_AUTH_SECRET environment variable",
      });
    }
    // Development: warn about session invalidation on restart
    logger.warn(
      "BETTER_AUTH_SECRET not set, using random value (sessions will be invalidated on restart)",
    );
    return randomUUID();
  }
  return secret;
}

export const env = await _createEnv({
  client: {
    VITE_API_URL: t.String(),
    VITE_BASE_URL: t.String(),
    VITE_PASS_ENCRYPTION_KEY: t.String(),
    FEATURE_MULTI_TEAM: t.Boolean(),
    VITE_AUTH_GITHUB_ENABLED: t.Optional(t.Boolean()),
    VITE_AUTH_GOOGLE_ENABLED: t.Optional(t.Boolean()),
  },
  server: {
    API_URL: t.String(),
    BASE_URL: t.String(),
    BETTER_AUTH_URL: t.String(),
    BETTER_AUTH_SECRET: t.String(),
    DATABASE_TYPE: t.Union([t.Literal("sqlite"), t.Literal("postgres")]),
    SQLITE_URL: t.Optional(t.String()),
    SQLITE_AUTH_TOKEN: t.Optional(t.String()),
    POSTGRES_USER: t.Optional(t.String()),
    POSTGRES_PASSWORD: t.Optional(t.String()),
    POSTGRES_DB: t.Optional(t.String()),
    POSTGRES_HOST: t.Optional(t.String()),
    POSTGRES_PORT: t.Optional(t.Number()),
    POSTGRES_URL: t.Optional(t.String()),
    POSTGRES_REPLICAS: t.Optional(t.String()),
    GITHUB_CLIENT_ID: t.Optional(t.String()),
    GITHUB_CLIENT_SECRET: t.Optional(t.String()),
    GOOGLE_CLIENT_ID: t.Optional(t.String()),
    GOOGLE_CLIENT_SECRET: t.Optional(t.String()),
    PORT: t.Number(),
    HOST: t.String(),
    PROTOCAL: t.String(),
    REDIS_URL: t.Optional(t.String()),
    WS_ENABLED: t.Optional(t.Boolean()),
    WS_HEARTBEAT_INTERVAL: t.Optional(t.Number()),
    WS_MAX_MESSAGE_SIZE: t.Optional(t.Number()),
    WS_RATE_LIMIT_MESSAGES: t.Optional(t.Number()),
    WS_RATE_LIMIT_WINDOW: t.Optional(t.Number()),
    EVLOG_ADAPTER: t.Optional(t.Union([t.Literal("fs"), t.Literal("otlp")])),
    EVLOG_DIR: t.Optional(t.String()),
    OTEL_EXPORTER_OTLP_ENDPOINT: t.Optional(t.String()),
    EVLOG_LOG_LEVEL: t.Optional(
      t.Union([t.Literal("debug"), t.Literal("info"), t.Literal("warn"), t.Literal("error")]),
    ),
  },
  runtimeEnv: () => ({
    VITE_API_URL: _getEnv("VITE_API_URL", ""),
    VITE_BASE_URL: _getEnv("VITE_BASE_URL", _BASE_URL),
    VITE_PASS_ENCRYPTION_KEY: _getEnv(
      "VITE_PASS_ENCRYPTION_KEY",
      "default-pass-key-replace-me-in-prod",
    ),
    API_URL: _getEnv("API_URL", `${_BASE_URL}/api`),
    BASE_URL: _getEnv("BASE_URL", _BASE_URL),
    BETTER_AUTH_URL: _getEnv("BETTER_AUTH_URL", `${_BASE_URL}/api/auth`),
    BETTER_AUTH_SECRET: _getAuthSecret(),
    DATABASE_TYPE: _getEnv("DATABASE_TYPE", "sqlite") as "sqlite" | "postgres",
    SQLITE_URL: _getEnv("SQLITE_URL", "") || undefined,
    SQLITE_AUTH_TOKEN: _getEnv("SQLITE_AUTH_TOKEN", "") || undefined,
    POSTGRES_USER: _getEnv("POSTGRES_USER", "") || undefined,
    POSTGRES_PASSWORD: _getEnv("POSTGRES_PASSWORD", "") || undefined,
    POSTGRES_DB: _getEnv("POSTGRES_DB", "") || undefined,
    POSTGRES_HOST: _getEnv("POSTGRES_HOST", "") || undefined,
    POSTGRES_PORT: parseInt(_getEnv("POSTGRES_PORT", ""), 10) || undefined,
    POSTGRES_URL: _getEnv("POSTGRES_URL", "") || undefined,
    POSTGRES_REPLICAS: (() => {
      const replicas = _getEnv("POSTGRES_REPLICAS", "");
      if (!replicas) return undefined;
      try {
        const parsed = JSON.parse(replicas);
        if (Array.isArray(parsed)) {
          return parsed.filter((url): url is string => typeof url === "string" && url.length > 0);
        }
        return undefined;
      } catch {
        return undefined;
      }
    })() as string | undefined,
    GITHUB_CLIENT_ID: _getEnv("GITHUB_CLIENT_ID", "") || undefined,
    GITHUB_CLIENT_SECRET: _getEnv("GITHUB_CLIENT_SECRET", "") || undefined,
    GOOGLE_CLIENT_ID: _getEnv("GOOGLE_CLIENT_ID", "") || undefined,
    GOOGLE_CLIENT_SECRET: _getEnv("GOOGLE_CLIENT_SECRET", "") || undefined,
    HOST: _getEnv("HOST", String(HOST)),
    PROTOCAL: _getEnv("PROTOCAL", String(PROTOCAL)),
    PORT: parseInt(_getEnv("PORT", String(PORT)), 10),
    REDIS_URL: _getEnv("REDIS_URL", "") || undefined,
    WS_ENABLED:
      _getEnv("WS_ENABLED", "") === "true"
        ? true
        : _getEnv("WS_ENABLED", "") === "false"
          ? false
          : undefined,
    WS_HEARTBEAT_INTERVAL: parseInt(_getEnv("WS_HEARTBEAT_INTERVAL", ""), 10) || undefined,
    WS_MAX_MESSAGE_SIZE: parseInt(_getEnv("WS_MAX_MESSAGE_SIZE", ""), 10) || undefined,
    WS_RATE_LIMIT_MESSAGES: parseInt(_getEnv("WS_RATE_LIMIT_MESSAGES", ""), 10) || undefined,
    WS_RATE_LIMIT_WINDOW: parseInt(_getEnv("WS_RATE_LIMIT_WINDOW", ""), 10) || undefined,
    FEATURE_MULTI_TEAM: _getEnv("FEATURE_MULTI_TEAM", "false") === "true",
    VITE_AUTH_GITHUB_ENABLED: _getEnv("VITE_AUTH_GITHUB_ENABLED", "true") === "true",
    VITE_AUTH_GOOGLE_ENABLED: _getEnv("VITE_AUTH_GOOGLE_ENABLED", "true") === "true",
    OTEL_EXPORTER_OTLP_ENDPOINT: _getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "") || undefined,
    EVLOG_DIR: _getEnv("EVLOG_DIR", ".evlog/logs"),
    EVLOG_ADAPTER: (_getEnv("EVLOG_ADAPTER", "fs") || "fs") as "fs" | "otlp",
    EVLOG_LOG_LEVEL: (_getEnv("EVLOG_LOG_LEVEL", "") || undefined) as
      | "debug"
      | "info"
      | "warn"
      | "error"
      | undefined,
  }),
});

export type Env = ReturnType<typeof _createEnv>;