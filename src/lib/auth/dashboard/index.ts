/**
 * WebSocket connection authentication module.
 * Validates session tokens during WebSocket handshake to ensure only authenticated users can connect.
 */

import type { Context } from "elysia";
import { auth } from "~/lib/auth";
import { authLogger, setIdentity } from "~/lib/logger";
import type { EvlogAuthSession } from "~/types/evlog";

/**
 * Authentication result containing user information if valid.
 */
export interface AuthResult {
  /** Unique user identifier */
  userId: string;
  /** User's email address */
  email: string;
  /** Session token for connection */
  sessionToken: string;
}

/**
 * Extracts and validates session token from WebSocket handshake request.
 * Supports extraction from query parameters or authorization header.
 *
 * @param request - The incoming request context
 * @returns Authentication result if valid, null if invalid
 *
 * @example
 * // Query parameter: ws://localhost:3000/ws?token=xxx
 * // Header: Authorization: Bearer xxx
 */
export async function authenticateConnection(request: Context): Promise<AuthResult | null> {
  try {
    // Extract token from query parameter or header
    const token = extractToken(request);

    if (!token) {
      authLogger.warn("WebSocket connection attempt without token");
      return null;
    }

    // Validate session using Better Auth
    const session = await auth.api.getSession({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (!session) {
      authLogger.warn("WebSocket connection with invalid session token");
      return null;
    }

    setIdentity(session as EvlogAuthSession);

    return {
      userId: session.session.userId,
      email: session.user.email,
      sessionToken: token,
    };
  } catch (error) {
    authLogger.error(`WebSocket authentication error: ${error}`);
    return null;
  }
}

/**
 * Extracts session token from request query params or Authorization header.
 *
 * @param request - Request context containing query and headers
 * @returns Token string if found, null otherwise
 */
function extractToken(request: Context): string | null {
  // Check query parameter first
  const queryToken = request.query?.token as string | undefined;
  if (queryToken) {
    return queryToken;
  }

  // Check Authorization header
  const authHeader = request.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Validates the origin header to prevent cross-site WebSocket hijacking.
 * Only allows connections from trusted origins.
 *
 * @param request - Request context containing origin header
 * @returns True if origin is valid, false otherwise
 */
export function validateOrigin(request: Context): boolean {
  const origin = request.headers?.origin;
  const allowedOrigins = process.env.ALLOWED_WS_ORIGINS?.split(",") || [];

  // If no allowed origins configured, allow all (development mode)
  if (allowedOrigins.length === 0) {
    return true;
  }

  // Check if origin is in allowed list
  return allowedOrigins.includes(origin || "");
}

/**
 * Middleware decorator for WebSocket authentication.
 * Applies to Elysia WebSocket handler to ensure authenticated connections.
 * Note: Authentication is validated at connection time, not per message.
 *
 * @param handler - WebSocket message handler
 * @returns Wrapped handler
 */
export function withAuth(handler: (data: unknown) => void): (data: unknown) => void {
  return (data: unknown) => {
    // Auth is validated at connection time by the plugin
    // This is a placeholder for additional message-level checks
    handler(data);
  };
}