import { type ClassValue, clsx } from "cnfast";
import { twMerge } from "cnfast";
import { computeRange } from "~/lib/pagination/compute";
import { COMMON_PAGINATION_RANGES_VALUES } from "~/lib/comptime/values";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts a string to title case.
 * e.g. "api reference" -> "Api Reference"
 * e.g. "ci cd"         -> "Ci Cd"
 */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Generates page numbers for pagination with ellipsis
 * @param currentPage - Current page number (1-based)
 * @param totalPages - Total number of pages
 * @returns Array of page numbers and ellipsis strings
 *
 * Examples:
 * - Small dataset (≤5 pages): [1, 2, 3, 4, 5]
 * - Near beginning: [1, 2, 3, 4, '...', 10]
 * - In middle: [1, '...', 4, 5, 6, '...', 10]
 * - Near end: [1, '...', 7, 8, 9, 10]
 *
 * @note Cache is pre-computed for totalPages <= 20 at build time.
 *       For totalPages > 20, returns all pages without ellipsis.
 */
export function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  // Use pre-computed cache for common page counts (1-20)
  const cacheKey = `${currentPage}-${totalPages}`;
  if (COMMON_PAGINATION_RANGES_VALUES[cacheKey]) {
    return [...COMMON_PAGINATION_RANGES_VALUES[cacheKey]];
  }

  // Fallback for >20 pages
  return computeRange(currentPage, totalPages);
}