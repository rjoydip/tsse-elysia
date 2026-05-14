/**
 * Pure computation functions for pagination ranges.
 * Used by both runtime utils and build-time comptime.
 */

const MAX_VISIBLE = 5;

/**
 * Computes the page range for a given current page and total pages.
 * Uses ellipsis for large page counts.
 */
export function computeRange(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= MAX_VISIBLE) {
    const range: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
    return range;
  }

  const rangeWithDots: (number | string)[] = [1];

  if (currentPage <= 3) {
    for (let i = 2; i <= 4; i++) rangeWithDots.push(i);
    rangeWithDots.push("...", totalPages);
  } else if (currentPage >= totalPages - 2) {
    rangeWithDots.push("...");
    for (let i = totalPages - 3; i <= totalPages; i++) rangeWithDots.push(i);
  } else {
    rangeWithDots.push("...");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) rangeWithDots.push(i);
    rangeWithDots.push("...", totalPages);
  }

  return rangeWithDots;
}

/**
 * Builds a cache of all page range combinations for totalPages <= 20.
 * Used for fast lookups instead of computing on each call.
 */
export function buildCache(): Record<string, (number | string)[]> {
  const cache: Record<string, (number | string)[]> = {};

  for (let totalPages = 1; totalPages <= 20; totalPages++) {
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      cache[`${currentPage}-${totalPages}`] = computeRange(currentPage, totalPages);
    }
  }

  return cache;
}