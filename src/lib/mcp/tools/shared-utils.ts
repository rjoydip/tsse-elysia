/**
 * Shared MCP tool utilities.
 * Extracted from mcp/tools/auth.ts and mcp/tools/users.ts to reduce duplication.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * Creates a standardized error response for MCP tools.
 *
 * @param message - Error message to return
 * @returns Formatted CallToolResult with error flag
 */
export function createErrorResponse(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

/**
 * Creates a standardized success response with JSON content for MCP tools.
 *
 * @template T - Type of the data being returned
 * @param data - Data to serialize and return
 * @returns Formatted CallToolResult with structured content
 */
export function createSuccessResponse<T extends Record<string, unknown>>(data: T): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    structuredContent: data,
  };
}

/**
 * Creates a success response with array data for MCP tools.
 *
 * @template T - Type of items in the array
 * @param items - Array of data items
 * @param key - Key name for the structured content (e.g., "users", "sessions")
 * @returns Formatted CallToolResult with structured content
 */
export function createListResponse<T extends Record<string, unknown>>(
  items: T[],
  key: string,
): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(items) }],
    structuredContent: { [key]: items },
  };
}

/**
 * Formats a Date to ISO string, handling null/undefined.
 *
 * @param date - Date to format
 * @returns ISO string or undefined
 */
export function formatDateToISO(date: Date | null | undefined): string | undefined {
  return date?.toISOString();
}