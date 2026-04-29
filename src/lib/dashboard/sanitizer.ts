/**
 * Content sanitization module for WebSocket messages.
 * Prevents XSS attacks by sanitizing user-generated content.
 */

import { logger } from "~/lib/logger";

/**
 * HTML entities that need to be escaped to prevent XSS.
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Regex pattern matching HTML special characters.
 */
const HTML_PATTERN = /[&<>"'/]/g;

/**
 * Escapes HTML special characters in a string.
 *
 * @param text - Input text to escape
 * @returns Escaped text safe for HTML rendering
 */
function escapeHtml(text: string): string {
  return text.replace(HTML_PATTERN, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Removes JavaScript protocol handlers and dangerous URL schemes.
 *
 * @param text - Input text containing URLs
 * @returns Text with dangerous schemes removed
 */
function sanitizeUrls(text: string): string {
  return text.replace(
    /(javascript|vbscript|data):/gi,
    (match) => `${match.substring(0, match.indexOf(":"))}:` + "_blocked_",
  );
}

/**
 * Removes potentially dangerous HTML tags.
 *
 * @param text - Input text potentially containing HTML
 * @returns Text with dangerous tags removed
 */
function removeDangerousTags(text: string): string {
  const dangerousTags = /<\/?(script|iframe|object|embed|form|input|link|meta|base)\b[^>]*>/gi;
  return text.replace(dangerousTags, "");
}

/**
 * Removes event handler attributes (onclick, onerror, etc.).
 *
 * @param text - Input text potentially containing event handlers
 * @returns Text with event handlers removed
 */
function removeEventHandlers(text: string): string {
  const eventPattern = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
  return text.replace(eventPattern, "");
}

/**
 * Removes data: URLs which can be used for XSS.
 *
 * @param text - Input text containing URLs
 * @returns Text with data: URLs removed
 */
function removeDataUrls(text: string): string {
  return text.replace(/data:[^,\s]*/gi, "blocked:");
}

/**
 * Sanitizes user-generated content for safe display.
 * Performs multiple passes to ensure content is safe.
 *
 * @param content - Raw user content
 * @returns Sanitized content safe for rendering
 *
 * @example
 * const safe = sanitizeContent(userMessage);
 * // <script>alert(1)</script> -> &lt;script&gt;alert(1)&lt;/script&gt;
 */
export function sanitizeContent(content: string): string {
  if (typeof content !== "string") {
    logger.warn("Sanitize received non-string content");
    return "";
  }

  let sanitized = content;

  // Step 1: Remove dangerous HTML tags first (before escaping)
  sanitized = removeDangerousTags(sanitized);

  // Step 2: Remove event handler attributes
  sanitized = removeEventHandlers(sanitized);

  // Step 3: Escape HTML entities
  sanitized = escapeHtml(sanitized);

  // Step 4: Sanitize URLs (remove javascript: etc.)
  sanitized = sanitizeUrls(sanitized);

  // Step 5: Remove data URLs
  sanitized = removeDataUrls(sanitized);

  return sanitized;
}

/**
 * Strips all HTML tags from text.
 *
 * @param text - Input text potentially containing HTML
 * @returns Plain text without HTML tags
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * Validates that a string doesn't contain suspicious patterns.
 *
 * @param text - Input text to validate
 * @returns True if text appears safe, false otherwise
 */
export function validateContent(text: string): boolean {
  // Check for common XSS patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:/i,
    /vbscript:/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes a full message object containing user content.
 *
 * @param message - Message object with potentially unsafe fields
 * @param fields - List of fields to sanitize
 * @returns Message with specified fields sanitized
 */
export function sanitizeMessage<T extends Record<string, unknown>>(
  message: T,
  fields: (keyof T)[],
): T {
  const sanitized = { ...message };

  for (const field of fields) {
    const value = sanitized[field];
    if (typeof value === "string") {
      sanitized[field] = sanitizeContent(value) as T[keyof T];
    }
  }

  return sanitized;
}