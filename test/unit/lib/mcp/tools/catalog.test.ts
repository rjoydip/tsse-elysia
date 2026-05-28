/**
 * Unit tests for MCP tool catalog metadata.
 * Keeps `/api/mcp/tools` discovery payload aligned with supported tool names.
 */
import { describe, expect, it } from "bun:test";
import { MCP_TOOL_CATALOG } from "~/lib/mcp/tools/catalog";

describe("MCP_TOOL_CATALOG", () => {
  it("should include expected tool identifiers", () => {
    const names = MCP_TOOL_CATALOG.map((tool) => tool.name);

    expect(names).toContain("get-current-user");
    expect(names).toContain("list-sessions");
    expect(names).toContain("revoke-session");
    expect(names).toContain("get-user");
    expect(names).toContain("list-users");
    expect(names).toContain("update-user");
    expect(names).toContain("get-organization");
    expect(names).toContain("list-members");
  });

  it("should contain unique names for stable client discovery", () => {
    const names = MCP_TOOL_CATALOG.map((tool) => tool.name);
    const unique = new Set(names);

    expect(unique.size).toBe(names.length);
  });
});