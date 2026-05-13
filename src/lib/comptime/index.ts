/**
 * Centralized build-time computations using comptime.
 * This module contains all values that are computed at build time
 * and inlined during the build process.
 *
 * @see https://github.com/lukeed/comptime
 */

import { comptime } from "comptime";
import {
  ROLE_HIERARCHY_VALUES,
  ADMIN_ROLES_VALUES,
  MANAGER_ROLES_VALUES,
  ALL_ROLES_VALUES,
  DASHBOARD_VIEWS_VALUES,
  DASHBOARD_VIEW_LEVELS_VALUES,
  HTTP_STATUS_TO_ERROR_MAP_VALUES,
  HTML_ENTITIES_MAP_VALUES,
  SUSPICIOUS_PATTERNS_VALUES,
  DANGEROUS_TAGS_PATTERN_SOURCE,
  DANGEROUS_TAGS_PATTERN_FLAGS,
  EVENT_HANDLER_PATTERN_SOURCE,
  EVENT_HANDLER_PATTERN_FLAGS,
  HTML_PATTERN_SOURCE,
  HTML_PATTERN_FLAGS,
  PAGINATION_MAX_VISIBLE_VALUE,
} from "./values";
import { buildCache } from "~/lib/pagination/compute";

/**
 * Build-time computed role hierarchy values.
 * Higher numeric values inherit permissions from lower roles.
 */
export const ROLE_HIERARCHY = comptime(() => ROLE_HIERARCHY_VALUES);

/**
 * Build-time computed admin-level roles that can manage users.
 */
export const ADMIN_ROLES = comptime(() => ADMIN_ROLES_VALUES);

/**
 * Build-time computed manager-level roles that can view team analytics.
 */
export const MANAGER_ROLES = comptime(() => MANAGER_ROLES_VALUES);

/**
 * Build-time computed all roles for iteration purposes.
 */
export const ALL_ROLES = comptime(() => ALL_ROLES_VALUES);

/**
 * Build-time computed dashboard view types.
 */
export const DASHBOARD_VIEWS = comptime(() => DASHBOARD_VIEWS_VALUES);

/**
 * Build-time computed dashboard view access levels.
 * Higher levels can access lower-level views.
 */
export const DASHBOARD_VIEW_LEVELS = comptime(() => DASHBOARD_VIEW_LEVELS_VALUES);

/**
 * Build-time computed HTTP status code to error class map.
 */
export const HTTP_STATUS_TO_ERROR_MAP = comptime(() => HTTP_STATUS_TO_ERROR_MAP_VALUES);

/**
 * Build-time computed HTML entities for sanitization.
 */
export const HTML_ENTITIES_MAP = comptime(() => HTML_ENTITIES_MAP_VALUES);

/**
 * Build-time computed suspicious XSS patterns.
 */
export const SUSPICIOUS_PATTERNS = comptime(() =>
  SUSPICIOUS_PATTERNS_VALUES.map((p) => new RegExp(p.source, p.flags)),
);

/**
 * Build-time computed dangerous HTML tags pattern.
 */
export const DANGEROUS_TAGS_PATTERN = comptime(
  () => new RegExp(DANGEROUS_TAGS_PATTERN_SOURCE, DANGEROUS_TAGS_PATTERN_FLAGS),
);

/**
 * Build-time computed event handler pattern.
 */
export const EVENT_HANDLER_PATTERN = comptime(
  () => new RegExp(EVENT_HANDLER_PATTERN_SOURCE, EVENT_HANDLER_PATTERN_FLAGS),
);

/**
 * Build-time computed HTML special characters pattern.
 */
export const HTML_PATTERN = comptime(() => new RegExp(HTML_PATTERN_SOURCE, HTML_PATTERN_FLAGS));

/**
 * Build-time computed pagination max visible pages.
 */
export const PAGINATION_MAX_VISIBLE = comptime(() => PAGINATION_MAX_VISIBLE_VALUE);

/**
 * Build-time computed pagination ranges for common page counts.
 * Maps (currentPage, totalPages) -> [1, 2, 3, 4, 5] patterns.
 */
export const COMMON_PAGINATION_RANGES = comptime(() => buildCache());