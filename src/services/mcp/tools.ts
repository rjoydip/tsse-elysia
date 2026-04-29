/**
 * MCP Tools catalog service.
 * Handles tool registry introspection and categorization.
 */

type ToolCategory = "auth" | "users" | "organization";

interface RegisteredToolInfo {
  title?: string;
  description?: string;
}

export interface ToolInfo {
  name: string;
  title: string;
  description: string;
  category: ToolCategory;
}

/**
 * Infers tool category from naming conventions used by MCP tool modules.
 *
 * @param toolName - The name of the tool
 * @returns Resolved category for the tool
 */
function resolveCategory(toolName: string): ToolCategory {
  if (toolName.includes("organization") || toolName.includes("member")) {
    return "organization";
  }
  if (toolName.includes("user")) {
    return "users";
  }
  return "auth";
}

/**
 * Converts the MCP server's live tool registry to the tool catalog shape.
 *
 * @param server - The MCP server instance with _registeredTools
 * @returns Tool metadata currently registered on the MCP server
 */
export function getLiveToolCatalogFromServer(server: unknown): ToolInfo[] {
  const mcpServer = server as { _registeredTools?: Record<string, RegisteredToolInfo> };
  const registeredTools = mcpServer._registeredTools ?? {};

  return Object.entries(registeredTools).map(([name, metadata]) => ({
    name,
    title: metadata.title ?? name,
    description: metadata.description ?? "",
    category: resolveCategory(name),
  }));
}