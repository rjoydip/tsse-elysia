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

import { randomUUID } from "uncrypto";
import { createError } from "evlog";
import { isBun, isNode, isProduction, PORT, HOST, PROTOCAL } from ".";
import { logger } from "../lib/logger";

/**
 * Creates a validated environment object with server/client boundary enforcement.
 * Uses a Proxy to intercept access and prevent server-only vars from leaking.
 *
 * @returns Proxy-wrapped environment object with type safety
 */
async function _createEnv() {
  // Get runtime environment
  const runtimeEnv = (() => {
    const _getEnv = (key: string, defaultValue: string = ""): string => {
      const value = isBun ? Bun.env[key] : isNode ? process.env?.[key] : undefined;
      return value ?? defaultValue;
    };

    const _BASE_URL = `${PROTOCAL}://${HOST}:${PORT}`;

    const _getAuthSecret = (): string => {
      const secret = _getEnv("BETTER_AUTH_SECRET", "");
      if (!secret) {
        if (isProduction) {
          throw createError({
            message: "BETTER_AUTH_SECRET is required in production",
            status: 500,
            why: "Production requires a stable auth secret",
            fix: "Set BETTER_AUTH_SECRET environment variable",
          });
        }
        logger.warn(
          "BETTER_AUTH_SECRET not set, using random value (sessions will be invalidated on restart)",
        );
        return randomUUID();
      }
      return secret;
    };

    return {
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
      SQLITE_URL: _getEnv("SQLITE_URL", "file:.artifacts/tsse-elysia.db") || undefined,
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
      })(),
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
    };
  })();

  // Determine if running on server - needed for access control decisions
  const isTest = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
  const isServer = typeof window === "undefined" || isTest;

  // Server-side: define schema and validate using Elysia (dynamic import to avoid bundling)
  const clientVars = new Set([
    "VITE_API_URL",
    "VITE_BASE_URL",
    "VITE_PASS_ENCRYPTION_KEY",
    "FEATURE_MULTI_TEAM",
    "VITE_AUTH_GITHUB_ENABLED",
    "VITE_AUTH_GOOGLE_ENABLED",
  ]);

  if (isServer) {
    const { t, getSchemaValidator } = await import("elysia");

    const clientSchema = {
      VITE_API_URL: t.String(),
      VITE_BASE_URL: t.String(),
      VITE_PASS_ENCRYPTION_KEY: t.String(),
      FEATURE_MULTI_TEAM: t.Boolean(),
      VITE_AUTH_GITHUB_ENABLED: t.Optional(t.Boolean()),
      VITE_AUTH_GOOGLE_ENABLED: t.Optional(t.Boolean()),
    };

    const serverSchema = {
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
    };

    const finalSchemaShape = {
      ...serverSchema,
      ...clientSchema,
    };

    const schema = getSchemaValidator(t.Object(finalSchemaShape)) as unknown as {
      Check: boolean;
      Errors?: string;
    };

    if (!schema.Check) {
      logger.error(`Invalid environment variables: ${JSON.stringify(schema.Errors)}`);
      throw createError({
        message: "Invalid environment variables",
        status: 500,
        why: "Environment validation failed",
        fix: "Check your environment configuration",
      });
    }
  }

  // Create Proxy-wrapped environment with access control
  // This prevents accidental server-only var leaks to client
  const env = new Proxy(runtimeEnv, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (prop === "__esModule" || prop === "$$typeof") return undefined;
      if (!isServer && prop !== "then" && !clientVars.has(prop)) {
        throw createError({
          message: `Attempted to access a server-side environment variable "${prop}" on the client`,
          status: 403,
          why: "Client-side code cannot access server-only variables",
          fix: "Remove server-only env var access from client code",
        });
      }
      return Reflect.get(target, prop);
    },
  });

  return env;
}

export const env = await _createEnv();

export type Env = typeof env;