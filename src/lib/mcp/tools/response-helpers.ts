/**
 * Shared response helpers for MCP tools.
 * Extracted from auth.ts and users.ts to reduce duplication.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { createSuccessResponse, createErrorResponse } from "./shared-utils";

/**
 * Builds a standard user response object.
 * Used in both auth.ts (get-current-user) and users.ts (get-user).
 *
 * @param user - User object from database (should have id, name, email, etc.)
 * @returns Standardized CallToolResult with user data
 */
export function buildUserResponse(user: {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  subscriptionTier: string;
}): CallToolResult {
  return createSuccessResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    subscriptionTier: user.subscriptionTier,
  });
}

/**
 * Maps a session object to a response-friendly format.
 * Used in auth.ts for list-sessions.
 */
export function mapSessionToResponse(session: {
  id: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  return {
    id: session.id,
    expiresAt: session.expiresAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    ipAddress: session.ipAddress ?? undefined,
    userAgent: session.userAgent ?? undefined,
  };
}

/**
 * Maps a user object to a list-friendly format.
 * Used in users.ts for list-users.
 */
export function mapUserToListResponse(user: {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name ?? undefined,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Wraps a tool handler with standard error handling.
 * Reduces duplication of try-catch blocks.
 *
 * @param handler - The actual handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T extends Record<string, unknown>>(
  handler: (args: T) => Promise<CallToolResult>,
): (args: T) => Promise<CallToolResult> {
  return async (args: T): Promise<CallToolResult> => {
    try {
      return await handler(args);
    } catch (error) {
      return createErrorResponse(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };
}