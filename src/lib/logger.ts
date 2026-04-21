/**
 * Centralized logging system for the application.
 * Provides structured logging with multiple levels, context support, and environment-aware filtering.
 * Built on top of Evlog for unified logging across client and server.
 *
 * @module logger
 */

import { log as evlogSimple } from "evlog";
import { isProduction } from "~/config";

/**
 * Log levels in priority order (lowest to highest).
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Log entry structure for structured logging.
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

/**
 * Logger configuration options.
 */
export interface LoggerOptions {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Enable colored output (for development) */
  enableColors?: boolean;
  /** Include context in output */
  enableContext?: boolean;
  /** Prefix for all log messages */
  prefix?: string;
}

/**
 * Production minimum log level - reduces noise in production.
 */
const DEFAULT_MIN_LEVEL: LogLevel = "info";

/**
 * Evlog logger instance that wraps Evlog with the existing API.
 * Provides backward-compatible methods (log, debug, info, warn, error, fatal).
 */
type WrappedLogger = Readonly<{
  debug: (message: string, context?: Record<string, unknown>) => void;
  log: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error) => void;
  fatal: (message: string, error?: Error) => void;
}>;

/**
 * Creates a centralized logging system with structured output.
 * Supports multiple log levels, context, and error tracking.
 * Built on top of Evlog for unified client/server logging.
 *
 * @param options - Logger configuration
 * @returns Logger object with methods for each level
 *
 * @example
 * const logger = createEvlogLogger({ prefix: "app" });
 * logger.info("Server started");
 * logger.warn("Memory usage high", { usage: "80%" });
 * logger.error("Database failed", new Error("connection refused"));
 */
export function createEvlogLogger(options: LoggerOptions = {}): WrappedLogger {
  const { minLevel = DEFAULT_MIN_LEVEL, prefix = "" } = options;

  /**
   * Determines if the given log level should be logged based on minLevel setting.
   */
  const shouldLog = (level: LogLevel): boolean => {
    const levels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
    const minIdx = levels.indexOf(minLevel);
    const levelIdx = levels.indexOf(level);
    return levelIdx >= minIdx;
  };

  /**
   * Core logging function that handles both context and error objects.
   */
  const log = (level: LogLevel, message: string, data?: Record<string, unknown> | Error) => {
    if (!shouldLog(level)) {
      return;
    }

    if (data instanceof Error) {
      evlogSimple.error({
        message,
        tag: prefix,
        error: data.message,
        stack: data.stack,
      });
    } else if (data && Object.keys(data).length > 0) {
      evlogSimple.info({ message, tag: prefix, ...data });
    } else {
      evlogSimple.info({ message });
    }
  };

  return {
    log: (message: string, context?: Record<string, unknown>) => log("info", message, context),
    debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
    info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
    warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
    error: (message: string, err?: Error) => log("error", message, err),
    fatal: (message: string, err?: Error) => log("fatal", message, err),
  };
}

/**
 * Default application logger instance.
 * Uses INFO level in production, DEBUG in development.
 */
export const logger = createEvlogLogger({
  minLevel: isProduction ? "info" : "debug",
  prefix: "app",
});

/**
 * Logger for authentication-related logs.
 * Useful for security monitoring and debugging auth issues.
 */
export const authLogger = createEvlogLogger({
  minLevel: isProduction ? "info" : "debug",
  prefix: "auth",
});

/**
 * Logger for API-related logs.
 * Useful for monitoring API performance and debugging request issues.
 */
export const apiLogger = createEvlogLogger({
  minLevel: isProduction ? "info" : "debug",
  prefix: "api",
});

/**
 * Logger for database-related logs.
 * Useful for debugging database connection and query issues.
 */
export const dbLogger = createEvlogLogger({
  minLevel: isProduction ? "warn" : "debug",
  prefix: "db",
});

/**
 * Logger for Cache-related logs.
 * Useful for monitoring Cache connection, Pub/Sub, and caching events.
 */
export const cacheLogger = createEvlogLogger({
  minLevel: isProduction ? "warn" : "debug",
  prefix: "cache",
});

/**
 * Terminal-style script logger utilities.
 * Provides colorful output for CLI scripts and setup tasks.
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * Logger for scripts.
 */
const srptLg = createEvlogLogger({
  prefix: "scripts",
});

/**
 * Script logger for terminal output.
 * Provides setup-style colored output for scripts.
 */
export const scriptLogger = {
  section: (title: string) => {
    srptLg.info("scripts", {
      message: `${colors.bright}${colors.blue}${title}${colors.reset} \n ${
        colors.blue + "=".repeat(title.length) + colors.reset
      }`,
    });
  },
  step: (stepNumber: number, title: string) => {
    srptLg.info("scripts", {
      message: `${colors.bright}Step ${stepNumber}:${colors.reset} ${title}`,
    });
  },
  list: (message: string) => {
    srptLg.info("scripts", {
      message: `  ${colors.dim}•${colors.reset} ${message}`,
    });
  },
  command: (cmd: string) => {
    srptLg.info("scripts", {
      message: `  ${colors.cyan}$${colors.reset} ${cmd}`,
    });
  },
  success: (message: string) => {
    srptLg.info("scripts", {
      message: `${colors.green}✓${colors.reset} ${message}`,
    });
  },
  log: (message: string) => {
    srptLg.info("scripts", {
      message: `${colors.cyan}ℹ${colors.reset} ${message}`,
    });
  },
  info: (message: string) => {
    srptLg.info("scripts", {
      message,
    });
  },
  warn: (message: string) => {
    srptLg.warn("scripts", {
      message: `${colors.yellow}⚠${colors.reset} ${message}`,
    });
  },
  error: (message: string) => {
    console.error(`${colors.red}✗${colors.reset} ${message}`);
  },
  debug: (message: string) => {
    if (!isProduction) {
      srptLg.info("scripts", {
        message: `${colors.magenta}⚡${colors.reset} ${message}`,
      });
    }
  },
};

/**
 * Initialize the global drain for standalone logging.
 * Called during app startup to wire up the FS/OTLP adapter.
 */
export function initDrain() {
  return { drain: undefined };
}

/**
 * User context for logging.
 * Stores the current user identity for enriched log entries.
 */
import type { EvlogUser, EvlogSession, EvlogAuthSession, EvlogUserContext } from "~/types/evlog";

let currentUserContext: EvlogUserContext | null = null;

/**
 * Sets the current user identity for log enrichment.
 * Called after session resolution in middleware/hooks.
 *
 * @param session - Better Auth session with user and session data
 * @param options - Configuration options (e.g., maskEmail)
 *
 * @example
 * const session = await auth.api.getSession({ headers });
 * if (session) {
 *   setIdentity(session);
 * }
 */
export function setIdentity(session: EvlogAuthSession, options?: { maskEmail?: boolean }) {
  const { user, session: sessionData } = session;

  const userData: EvlogUser = {
    id: user.id,
    name: user.name,
    email: options?.maskEmail ? user.email?.replace(/(.{2}).*(@.*)/, "$1***$2") : user.email,
    image: user.image,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };

  const sessionDataOut: EvlogSession = {
    id: sessionData.id,
    expiresAt: sessionData.expiresAt,
    ipAddress: sessionData.ipAddress,
    userAgent: sessionData.userAgent,
    createdAt: sessionData.createdAt,
  };

  currentUserContext = {
    userId: user.id,
    user: userData,
    session: sessionDataOut,
  };
}

/**
 * Gets the current user identity for log enrichment.
 * Returns context to add to log entries.
 *
 * @returns User context or null if not authenticated
 *
 * @example
 * const identity = getIdentity();
 * if (identity) {
 *   log.info({ action: 'checkout', ...identity });
 * }
 */
export function getIdentity() {
  return currentUserContext;
}

/**
 * Clears the current user identity.
 * Called on logout or session expiry.
 *
 * @example
 * // On logout
 * clearIdentity();
 */
export function clearIdentity() {
  currentUserContext = null;
}

// Re-export types for convenience
export type { EvlogUser, EvlogSession, EvlogAuthSession, EvlogUserContext } from "~/types/evlog";