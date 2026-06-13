/**
 * Central configuration for the TSS Elysia application.
 * Defines environment-based settings and middleware configurations.
 */

import { type ElysiaConfig } from "elysia";

/**
 * Safely get environment variable with fallback.
 * Handles cases where import.meta.env might be undefined in SSR.
 */
function getEnvVar(key: string, fallback: string): string {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return (import.meta.env[key] as string) ?? fallback;
  }
  return fallback;
}

/**
 * Application version from package.json.
 * Automatically synced with the root package.json version.
 */
export const APP_VERSION = "0.0.0";

/**
 * API route prefix - defaults to /api.
 * Used for organizing API endpoints under a common path.
 */
export const API_PREFIX = getEnvVar("API_PREFIX", "/api");

/**
 * Authentication route pattern - catches all auth-related requests.
 * Better Auth uses /auth/* for its endpoints.
 */
export const AUTH_PREFIX = "/auth/*";

/**
 * GitHub repository URL for the project.
 * Used in the footer and documentation links.
 * Can be overridden via GITHUB_REPO_URL environment variable.
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/llmo
 */
export const GITHUB_REPO_URL = getEnvVar(
  "GITHUB_REPO_URL",
  "https://github.com/rjoydip/tsse-elysia",
);

/**
 * Application name for display and OpenAPI documentation.
 * Falls back to "TSS ELYSIA" if not set in environment.
 */
export const APP_NAME = getEnvVar("VITE_APP_NAME", "TSSE");

/**
 * Server host - defaults to localhost for development.
 * Should be configured for production deployments.
 * @example
 * // In production, set HOST=0.0.0.0 or yourdomain.com
 */
export const HOST = getEnvVar("HOST", "localhost");

/**
 * Server port - defaults to 3000 for local development.
 * Must match the port the Vite dev server runs on.
 * @example
 * // Runs on port 3000 by default
 * // Set PORT=8080 for alternative port
 */
export const PORT = parseInt(getEnvVar("PORT", "3000"), 10);

/**
 * Protocol used for HTTP/HTTPS connections.
 * Defaults to "http" for development, should be "https" in production.
 * @example
 * // Development: http
 * // Production: https
 */
export const PROTOCAL = getEnvVar("PROTOCAL", "http");

/**
 * Base URL for the application combining protocol, host, and port.
 * Used to construct full URLs for redirects and API calls.
 * @example
 * // Local development: http://localhost:3000
 * // Production: https://yourdomain.com
 */
export const BASE_URL = `${PROTOCAL}://${HOST}:${PORT}`;

/**
 * Runtime environment detection - checks if code runs in browser.
 * Used to conditionally execute server-only code on the client.
 * @example
 * if (isBrowser) {
 *   // Browser-specific code (window, document available)
 * }
 */
export const isBrowser = typeof window !== "undefined" && window.document !== undefined;

/**
 * Runtime environment detection - checks if code runs on server.
 * Server-side rendering (SSR) uses this to prevent client-side execution.
 * @example
 * if (isServer) {
 *   // Server-only code (database, file system access)
 * }
 */
export const isServer = typeof window === "undefined";

/**
 * Runtime detection - checks if Bun runtime is available.
 * Used to leverage Bun-specific APIs (e.g., Bun.password, Bun.env).
 */
export const isBun = typeof Bun !== "undefined";

/**
 * Runtime detection - checks if Node.js runtime is available.
 * Fallback for environments without Bun (production, other runtimes).
 */
export const isNode = typeof process !== "undefined" && !!process.versions?.node;

/**
 * Production environment detection.
 * Enables/disables features based on deployment environment.
 * @example
 * if (isProduction) {
 *   // Disable debug logging, enable stricter security
 * }
 */
export const isProduction = isBun
  ? Bun.env.NODE_ENV === "production"
  : isNode
    ? process.env.NODE_ENV === "production"
    : false;

export const isTest = isBun
  ? Bun.env.NODE_ENV === "test"
  : isNode
    ? process.env.NODE_ENV === "test"
    : false;

/**
 * CI environment detection.
 * Used to force PGlite in CI pipelines regardless of other PG settings.
 */
export const isCI = isBun ? Bun.env.CI === "true" : isNode ? process.env.CI === "true" : false;

/**
 * Development environment detection.
 * Used for local development with hot-reload features.
 */
export const isDev = isBun
  ? Bun.env.NODE_ENV === "development"
  : isNode
    ? process.env.NODE_ENV === "development"
    : false;

/**
 * Staging environment detection.
 * Used for pre-production testing environments.
 */
export const isStage = isBun
  ? Bun.env.NODE_ENV === "stage"
  : isNode
    ? process.env.NODE_ENV === "stage"
    : false;

/**
 * QA environment detection.
 * Used for quality assurance testing environments.
 */
export const isQA = isBun
  ? Bun.env.NODE_ENV === "qa"
  : isNode
    ? process.env.NODE_ENV === "qa"
    : false;

/**
 * Allowed HTTP methods for authentication endpoints.
 * Restricts API to safe methods only - prevents destructive operations.
 */
export const AUTH_ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE"];

/**
 * Canonical auth service name used by root/health payloads.
 */
export const AUTH_SERVICE_NAME = "Auth";

/**
 * Number of recent users to display in the dashboard component.
 * Should be consistent with the number of users fetched from the API.
 * Can be adjusted based on UI design and performance considerations.
 * @example
 * // Set to 10 for a concise list, or 20 for more visibility.
 * const RECENT_USERS_COUNT = 10;
 * Make sure to update the API endpoint to fetch the same number of users.
 */
export const RECENT_USERS_COUNT = 10;

/**
 * Navigation items for the header component.
 * Defines the main sections of the site for easy access.
 * Should be updated to reflect actual site structure and content.
 */
export const navItems = [
  { name: "Documentation", href: "/docs" },
  { name: "Blog", href: "/blog" },
];

/**
 * Status page configuration.
 */
export const statusPageConfig = {
  manualRefreshCooldownMs: 10000, // 10 seconds
};

/**
 * Elysia server configuration.
 * Defines core server behavior including websocket and response handling.
 * @property normalize - Normalize paths (remove trailing slashes)
 * @property prefix - Global route prefix (empty for this app)
 * @property nativeStaticResponse - Use native response objects
 * @property websocket - WebSocket connection settings
 */
export const appConfig: ElysiaConfig<any> = {
  normalize: true,
  prefix: "",
  nativeStaticResponse: true,
  websocket: {
    idleTimeout: 30,
  },
};

// Monitoring configuration.
// Controls the scheduling of health checks.
export const monitoringConfig = {
  // Cron pattern for health checks.
  // Default: Every 5 minutes (*/5 * * * *)
  // Format: [second] [minute] [hour] [day of month] [month] [day of week]
  // Examples:
  //   */5 * * * * - Every 5 minutes
  //   0 */15 * * * - Every 15 minutes
  //   0 0 * * * - Daily at midnight
  heartbeatPattern: getEnvVar("MONITORING_HEARTBEAT_PATTERN", "*/5 * * * *"),
};

/**
 * Session configuration for Better Auth.
 * @property expiresIn - Session lifetime in milliseconds (7 days)
 * @property updateAge - How often to update session timestamp (24 hours)
 */
export const sessionConfig = {
  expiresIn: 60 * 60 * 24 * 7, // 7 days (in seconds)
  updateAge: 60 * 60 * 24, // 24 hours (in seconds)
};

/**
 * Rate limiting configuration.
 * Applied to unauthenticated requests as baseline protection.
 * @property duration - Time window in milliseconds (60 seconds)
 * @property max - Maximum requests allowed in the duration window
 * @property cleanupInterval - Interval for cleanup of expired entries in ms
 */
export const rateLimitConfig = {
  duration: 60_000,
  max: 100,
  cleanupInterval: 60_000,
};

/**
 * CORS (Cross-Origin Resource Sharing) configuration.
 * Controls which origins can access API endpoints.
 * @property origin - Allowed origin (* = any, specific domain for production)
 * @property methods - HTTP methods permitted across origins
 * @property allowedHeaders - Request headers allowed from clients
 * @property exposedHeaders - Response headers accessible to clients
 * @property credentials - Allow cookies/auth headers in cross-origin requests
 * @property maxAge - How long browser caches preflight results (seconds)
 */
export const corsConfig = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Request-Id", "X-Response-Time"],
  credentials: true,
  maxAge: 86400,
};

/**
 * Security headers configuration using Helmet.js principles.
 * Provides defense-in-depth against common web vulnerabilities.
 * Each flag enables specific security headers when true.
 */
export const helmetConfig = {
  contentSecurityPolicy: true, // Prevents XSS by controlling resource loading
  crossOriginEmbedderPolicy: false, // Disable for ES modules compatibility
  crossOriginOpenerPolicy: false, // Allow cross-origin window access
  crossOriginResourcePolicy: false, // Allow cross-origin resource loading
  originAgentCluster: false, // Disable for cross-origin isolation
  referrerPolicy: "strict-origin-when-cross-origin", // Control referrer info
  strictTransportSecurity: false, // Disable (handled by reverse proxy)
  xContentTypeOptions: true, // Prevent MIME type sniffing
  xDnsPrefetchControl: false, // Disable DNS prefetching
  xDownloadOptions: false, // Disable file download navigation
  xFrameOptions: false, // Disable clickjacking protection
  xPermittedCrossDomainPolicies: false, // Disable Adobe Flash policies
  xPoweredBy: false, // Hide server technology info
  xXssProtection: false, // Deprecated, rely on CSP instead
};

/**
 * List of available font names (visit the url `/settings/appearance`).
 * This array is used to generate dynamic font classes (e.g., `font-inter`, `font-manrope`).
 *
 * 📝 How to Add a New Font (Tailwind v4+):
 * 1. Add the font name here.
 * 2. Update the `<link>` tag in 'index.html' to include the new font from Google Fonts (or any other source).
 * 3. Add the new font family to 'index.css' using the `@theme inline` and `font-family` CSS variable.
 *
 * Example:
 * fonts.ts           → Add 'roboto' to this array.
 * index.html         → Add Google Fonts link for Roboto.
 * index.css          → Add the new font in the CSS, e.g.:
 *   @theme inline {
 *      // ... other font families
 *      --font-roboto: 'Roboto', var(--font-sans);
 *   }
 */
export const fonts = ["inter", "manrope", "system"] as const;

/**
 * Currency configuration for dashboard displays.
 * Controls how monetary values are formatted across the UI.
 * @property code - ISO 4217 currency code (e.g., "INR", "USD", "EUR")
 * @property locale - Locale for number formatting (e.g., "en-IN", "en-US", "de-DE")
 * @property symbol - Currency symbol display character
 */
export const currencyConfig = {
  code: getEnvVar("CURRENCY_CODE", "INR"),
  locale: getEnvVar("CURRENCY_LOCALE", "en-IN"),
  symbol: "₹",
} as const;