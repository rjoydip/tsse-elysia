/**
 * Unit tests for MCP user tool input validation rules.
 * Verifies `list-users` enforces pagination bounds in its schema.
 */
import { describe, expect, it } from "bun:test";
import { getMcpServer } from "~/lib/mcp/server";

type RegisteredTool = {
  inputSchema?: {
    safeParse: (value: unknown) => { success: boolean };
  };
};

describe("list-users tool input bounds", () => {
  /**
   * Reads the live `list-users` input schema from the registered MCP tool set.
   */
  function getListUsersInputSchema() {
    const server = getMcpServer() as unknown as {
      _registeredTools?: Record<string, RegisteredTool>;
    };
    return server._registeredTools?.["list-users"]?.inputSchema;
  }

  it("should reject limit values outside allowed range", () => {
    const inputSchema = getListUsersInputSchema();
    expect(inputSchema).toBeDefined();

    const tooSmallLimit = inputSchema?.safeParse({ limit: 0, offset: 0 });
    const tooLargeLimit = inputSchema?.safeParse({ limit: 101, offset: 0 });

    expect(tooSmallLimit?.success).toBe(false);
    expect(tooLargeLimit?.success).toBe(false);
  });

  it("should reject negative offset values", () => {
    const inputSchema = getListUsersInputSchema();
    expect(inputSchema).toBeDefined();

    const invalidOffset = inputSchema?.safeParse({ limit: 10, offset: -1 });
    expect(invalidOffset?.success).toBe(false);
  });

  it("should accept bounded integer pagination values", () => {
    const inputSchema = getListUsersInputSchema();
    expect(inputSchema).toBeDefined();

    const validInput = inputSchema?.safeParse({ limit: 25, offset: 5 });
    expect(validInput?.success).toBe(true);
  });
});