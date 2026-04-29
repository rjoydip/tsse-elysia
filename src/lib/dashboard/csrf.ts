/**
 * CSRF token validation for WebSocket connections.
 * Prevents cross-site WebSocket hijacking attacks.
 */

import { getRandomValues } from "uncrypto";
import { logger } from "~/lib/logger";

/**
 * CSRF token configuration.
 */
export interface CsrfConfig {
  /** Enable CSRF validation in production */
  enabled: boolean;
  /** Token length in bytes */
  tokenLength: number;
  /** Custom header to check for token */
  headerName: string;
}

/**
 * Default CSRF configuration.
 */
export const defaultCsrfConfig: CsrfConfig = {
  enabled: process.env.NODE_ENV === "production",
  tokenLength: 32,
  headerName: "x-csrf-token",
};

/**
 * Generates a CSRF token.
 *
 * @param length - Token length in bytes
 * @returns Random token string
 */
export function generateCsrfToken(length: number = 32): string {
  const buffer = new Uint8Array(length);
  getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Validates CSRF token from request.
 * In production, validates the token; in development, skips validation.
 *
 * @param token - Token from request header
 * @param expectedToken - Expected token stored in session
 * @param config - CSRF configuration
 * @returns True if valid or validation disabled
 *
 * @example
 * const token = request.headers['x-csrf-token'];
 * const sessionToken = getSessionCsrfToken(sessionId);
 * if (!validateCsrfToken(token, sessionToken)) {
 *   return { error: 'CSRF validation failed' };
 * }
 */
export function validateCsrfToken(
  token: string | undefined,
  expectedToken: string | null,
  config: CsrfConfig = defaultCsrfConfig,
): boolean {
  // Skip validation in development
  if (!config.enabled) {
    return true;
  }

  // No token provided
  if (!token) {
    logger.warn("CSRF token missing from WebSocket connection");
    return false;
  }

  // No expected token (shouldn't happen for authenticated users)
  if (!expectedToken) {
    logger.warn("No expected CSRF token in session");
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  const valid = timingSafeEqual(token, expectedToken);

  if (!valid) {
    logger.warn("CSRF token mismatch");
  }

  return valid;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * In-memory CSRF token store.
 * In production, use Redis or database for session persistence.
 */
class CsrfTokenStore {
  private tokens = new Map<string, { token: string; expiresAt: number }>();

  /**
   * Stores a CSRF token for a session.
   *
   * @param sessionId - Session identifier
   * @param token - CSRF token
   * @param maxAge - Token validity in milliseconds (default 24 hours)
   */
  set(sessionId: string, token: string, maxAge: number = 86400000): void {
    this.tokens.set(sessionId, {
      token,
      expiresAt: Date.now() + maxAge,
    });
  }

  /**
   * Gets the CSRF token for a session.
   *
   * @param sessionId - Session identifier
   * @returns Token if valid, null otherwise
   */
  get(sessionId: string): string | null {
    const entry = this.tokens.get(sessionId);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.tokens.delete(sessionId);
      return null;
    }

    return entry.token;
  }

  /**
   * Deletes CSRF token for a session.
   *
   * @param sessionId - Session identifier
   */
  delete(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * Cleans up expired tokens.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, entry] of this.tokens) {
      if (now > entry.expiresAt) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

/**
 * Singleton CSRF token store.
 */
export const csrfTokenStore = new CsrfTokenStore();