/**
 * Authentication-related MCP tools.
 * Provides tools for managing user sessions and getting current user info.
 * Note: API key context is passed via global storage for simplicity.
 */

import type { McpServer } from "@modelcontextprotocol/server";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { z } from "zod";
import { db } from "~/config/db";
import { users, sessions } from "~/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { getCurrentApiKey } from "../auth";
import { createErrorResponse, createSuccessResponse } from "./shared-utils";
import { buildUserResponse, mapSessionToResponse } from "./response-helpers";
import { requireUserId } from "../shared/auth-utils";

/**
 * Registers authentication-related MCP tools.
 */
export function registerAuthTools(server: McpServer): void {
  /**
   * Get current authenticated user.
   * Returns the user associated with the API key.
   */
  server.registerTool(
    "get-current-user",
    {
      title: "Get Current User",
      description:
        "Get the authenticated user's profile information. " +
        "Returns the user's ID, name, email, and profile image.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string(),
        emailVerified: z.boolean(),
        image: z.string().optional(),
        createdAt: z.string(),
        subscriptionTier: z.string(),
      }),
    },
    async (): Promise<CallToolResult> => {
      try {
        const authError = requireUserId();
        if (authError) return authError;

        const apiKey = getCurrentApiKey()!;

        const user = await db.query.users.findFirst({
          where: eq(users.id, apiKey.userId),
        });

        if (!user) {
          return createErrorResponse("User not found");
        }

        return buildUserResponse(user);
      } catch (error) {
        return createErrorResponse(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  /**
   * List active sessions for the current user.
   */
  server.registerTool(
    "list-sessions",
    {
      title: "List Sessions",
      description:
        "List all active sessions for the current user. " +
        "Returns session ID, creation time, expiration, IP address, and user agent.",
      inputSchema: z.object({}),
      outputSchema: z.array(
        z.object({
          id: z.string(),
          expiresAt: z.string(),
          createdAt: z.string(),
          ipAddress: z.string().optional(),
          userAgent: z.string().optional(),
        }),
      ),
    },
    async (): Promise<CallToolResult> => {
      try {
        const authError = requireUserId();
        if (authError) return authError;

        const apiKey = getCurrentApiKey()!;

        const userSessions = await db.query.sessions.findMany({
          where: eq(sessions.userId, apiKey.userId),
        });

        const sessionList = userSessions.map((s: typeof sessions.$inferSelect) =>
          mapSessionToResponse(s),
        );

        return {
          content: [{ type: "text", text: JSON.stringify(sessionList) }],
          structuredContent: { sessions: sessionList },
        };
      } catch (error) {
        return createErrorResponse(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  /**
   * Revoke a specific session.
   */
  server.registerTool(
    "revoke-session",
    {
      title: "Revoke Session",
      description:
        "Revoke (delete) a specific session. " +
        "Use this to force-logout from a specific device or session. " +
        "Requires the session ID which can be obtained from list-sessions.",
      inputSchema: z.object({
        sessionId: z.string().describe("The ID of the session to revoke"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      annotations: {
        title: "Revoke Session",
        destructiveHint: true,
        idempotentHint: true,
      },
    },
    async (args: Record<string, unknown>): Promise<CallToolResult> => {
      try {
        const authError = requireUserId();
        if (authError) return authError;

        const apiKey = getCurrentApiKey()!;

        const sessionId = args.sessionId as string;

        // Verify session belongs to user
        const session = await db.query.sessions.findFirst({
          where: eq(sessions.id, sessionId),
        });

        if (!session || session.userId !== apiKey.userId) {
          return createErrorResponse("Session not found");
        }

        // Delete the session
        await db.delete(sessions).where(eq(sessions.id, sessionId));

        return createSuccessResponse({
          success: true,
          message: "Session revoked successfully",
        });
      } catch (error) {
        return createErrorResponse(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );
}