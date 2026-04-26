/**
 * User management MCP tools.
 * Provides tools for retrieving and managing user data.
 * Uses global async storage for API key context.
 */

import type { McpServer } from "@modelcontextprotocol/server";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { z } from "zod";
import { db } from "~/config/db";
import { users } from "~/lib/db/core/schema";
import { eq } from "drizzle-orm";
import { getCurrentApiKey } from "../auth";

/**
 * Upper bound for `list-users` pagination to prevent oversized responses.
 */
const MAX_LIST_USERS_LIMIT = 100;

/**
 * Registers user management MCP tools.
 */
export function registerUserTools(server: McpServer): void {
  /**
   * Get a user by ID.
   * Returns user details for a specific user ID.
   */
  server.registerTool(
    "get-user",
    {
      title: "Get User",
      description:
        "Get user details by user ID. " +
        "Returns the user's profile information including name, email, and image.",
      inputSchema: z.object({
        userId: z.string().describe("The ID of the user to retrieve"),
      }),
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
    async (args: Record<string, unknown>): Promise<CallToolResult> => {
      try {
        const apiKey = getCurrentApiKey();
        if (!apiKey) {
          return {
            content: [{ type: "text", text: "Authentication required" }],
            isError: true,
          };
        }

        const targetUserId = args.userId as string;

        // Check access - user can only access themselves unless org-scoped
        if (!apiKey.organizationId && targetUserId !== apiKey.userId) {
          return {
            content: [{ type: "text", text: "Access denied" }],
            isError: true,
          };
        }

        const user = await db.query.users.findFirst({
          where: eq(users.id, targetUserId),
        });

        if (!user) {
          return {
            content: [{ type: "text", text: "User not found" }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image,
                createdAt: user.createdAt.toISOString(),
                subscriptionTier: user.subscriptionTier,
              }),
            },
          ],
          structuredContent: {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: user.createdAt.toISOString(),
            subscriptionTier: user.subscriptionTier,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  /**
   * List users.
   * Returns a list of users, optionally filtered by organization.
   */
  server.registerTool(
    "list-users",
    {
      title: "List Users",
      description:
        "List users in the system. " +
        "For organization-scoped keys, returns users in the organization. " +
        "For user-scoped keys, returns only the authenticated user.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_LIST_USERS_LIMIT)
          .optional()
          .default(50)
          .describe(`Maximum number of users to return (1-${MAX_LIST_USERS_LIMIT})`),
        offset: z.number().int().min(0).optional().default(0).describe("Number of users to skip"),
      }),
      outputSchema: z.array(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          email: z.string(),
          emailVerified: z.boolean(),
          image: z.string().optional(),
          createdAt: z.string(),
        }),
      ),
    },
    async (args: Record<string, unknown>): Promise<CallToolResult> => {
      try {
        const apiKey = getCurrentApiKey();
        if (!apiKey) {
          return {
            content: [{ type: "text", text: "Authentication required" }],
            isError: true,
          };
        }

        let userList: Array<{
          id: string;
          name: string | null;
          email: string;
          emailVerified: boolean;
          image: string | null;
          createdAt: Date;
        }> = [];
        const limit = Math.min(
          MAX_LIST_USERS_LIMIT,
          Math.max(1, (args.limit as number | undefined) ?? 50),
        );
        const offset = Math.max(0, (args.offset as number | undefined) ?? 0);

        if (apiKey.organizationId) {
          // Until organization membership joins are implemented, do not allow broad user listing.
          return {
            content: [
              {
                type: "text",
                text: "Organization-scoped user listing is temporarily unavailable until organization membership filtering is implemented.",
              },
            ],
            isError: true,
          };
        } else {
          // For user-scoped, return only self
          const user = await db.query.users.findFirst({
            where: eq(users.id, apiKey.userId),
          });
          if (user) userList = [user as (typeof userList)[number]];
        }

        const userData = userList.map((u) => ({
          id: u.id,
          name: u.name ?? undefined,
          email: u.email,
          emailVerified: u.emailVerified,
          image: u.image ?? undefined,
          createdAt: u.createdAt.toISOString(),
        }));
        const paginatedUserData = userData.slice(offset, offset + limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(paginatedUserData),
            },
          ],
          structuredContent: { users: paginatedUserData },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  /**
   * Update user profile.
   */
  server.registerTool(
    "update-user",
    {
      title: "Update User",
      description:
        "Update the current user's profile. " +
        "Can update name and image. Email cannot be changed through this tool.",
      inputSchema: z.object({
        name: z.string().optional().describe("User's display name"),
        image: z.string().optional().describe("URL to user's profile image"),
      }),
      outputSchema: z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string(),
        image: z.string().optional(),
      }),
      annotations: {
        title: "Update User",
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args: Record<string, unknown>): Promise<CallToolResult> => {
      try {
        const apiKey = getCurrentApiKey();
        if (!apiKey) {
          return {
            content: [{ type: "text", text: "Authentication required" }],
            isError: true,
          };
        }

        const updates: { name?: string; image?: string } = {};

        if (args.name !== undefined) {
          updates.name = args.name as string;
        }
        if (args.image !== undefined) {
          updates.image = args.image as string;
        }

        if (Object.keys(updates).length === 0) {
          return {
            content: [{ type: "text", text: "No fields to update" }],
            isError: true,
          };
        }

        const [updated] = await db
          .update(users)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(users.id, apiKey.userId))
          .returning();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                id: updated.id,
                name: updated.name,
                email: updated.email,
                image: updated.image,
              }),
            },
          ],
          structuredContent: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            image: updated.image,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}