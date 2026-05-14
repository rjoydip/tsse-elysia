/**
 * Centralized constant values used by comptime computations.
 * These are the source of truth for build-time computed values.
 *
 * @see https://github.com/lukeed/comptime
 */

/**
 * Role hierarchy values.
 * Higher numeric values inherit permissions from lower roles.
 */
export const ROLE_HIERARCHY_VALUES: Record<string, number> = {
  user: 0,
  cashier: 1,
  manager: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Admin-level roles that can manage users.
 */
export const ADMIN_ROLES_VALUES = ["admin", "superadmin"] as const;

/**
 * Manager-level roles that can view team analytics.
 */
export const MANAGER_ROLES_VALUES = ["manager", "admin", "superadmin"] as const;

/**
 * All roles for iteration purposes.
 */
export const ALL_ROLES_VALUES = ["user", "cashier", "manager", "admin", "superadmin"] as const;

/**
 * Dashboard view types.
 */
export const DASHBOARD_VIEWS_VALUES = ["full", "analytics", "team", "sales", "basic"] as const;

/**
 * Dashboard view access levels.
 * Higher levels can access lower-level views.
 */
export const DASHBOARD_VIEW_LEVELS_VALUES: Record<string, number> = {
  basic: 0,
  sales: 1,
  team: 2,
  analytics: 3,
  full: 4,
};

/**
 * HTTP status code to error class map.
 */
export const HTTP_STATUS_TO_ERROR_MAP_VALUES = {
  400: "ValidationError",
  404: "NotFoundError",
  409: "DuplicateKeyError",
  500: "DatabaseError",
} as const;

/**
 * HTML entities for sanitization.
 */
export const HTML_ENTITIES_MAP_VALUES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Suspicious XSS patterns (as source strings for regex compilation).
 */
export const SUSPICIOUS_PATTERNS_VALUES = [
  { source: "<script", flags: "i" },
  { source: "javascript:", flags: "i" },
  { source: "on\\w+\\s*=", flags: "i" },
  { source: "<iframe", flags: "i" },
  { source: "<object", flags: "i" },
  { source: "<embed", flags: "i" },
  { source: "data:", flags: "i" },
  { source: "vbscript:", flags: "i" },
] as const;

/**
 * Dangerous HTML tags pattern source.
 */
export const DANGEROUS_TAGS_PATTERN_SOURCE =
  "<\\/?(script|iframe|object|embed|form|input|link|meta|base)\\b[^>]*>";
export const DANGEROUS_TAGS_PATTERN_FLAGS = "gi";

/**
 * Event handler pattern source.
 */
export const EVENT_HANDLER_PATTERN_SOURCE = "\\s*on\\w+\\s*=\\s*[\"'][^\"']*[\"']";
export const EVENT_HANDLER_PATTERN_FLAGS = "gi";

/**
 * HTML special characters pattern source.
 */
export const HTML_PATTERN_SOURCE = "[&<>\"'/]";
export const HTML_PATTERN_FLAGS = "g";

/**
 * Pagination max visible pages.
 */
export const PAGINATION_MAX_VISIBLE_VALUE = 5;

/**
 * Pre-computed pagination ranges for common page counts (1-20).
 * Maps (currentPage, totalPages) -> page number arrays with ellipsis.
 * Used to avoid runtime computation for common pagination scenarios.
 */
import { buildCache } from "~/lib/pagination/compute";
export const COMMON_PAGINATION_RANGES_VALUES = buildCache();