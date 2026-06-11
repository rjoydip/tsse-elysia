/**
 * Unit tests for the Devkit module.
 * Tests that RPCs are properly registered and the module structure is valid.
 */

import { describe, it, expect } from "bun:test";
import { rpcMap, rpcNames } from "../../../tools/devkit/index";

describe("Devkit Module", () => {
  it("should export an rpcMap with all tools", () => {
    expect(rpcMap).toBeDefined();
    expect(Object.keys(rpcMap).length).toBe(5);
  });

  it("should include db:health RPC", () => {
    expect(rpcMap["db:health"]).toBeDefined();
    expect(rpcMap["db:health"].name).toBe("db:health");
  });

  it("should include db:stats RPC", () => {
    expect(rpcMap["db:stats"]).toBeDefined();
    expect(rpcMap["db:stats"].name).toBe("db:stats");
  });

  it("should include cache:health RPC", () => {
    expect(rpcMap["cache:health"]).toBeDefined();
    expect(rpcMap["cache:health"].name).toBe("cache:health");
  });

  it("should include cache:stats RPC", () => {
    expect(rpcMap["cache:stats"]).toBeDefined();
    expect(rpcMap["cache:stats"].name).toBe("cache:stats");
  });

  it("should include system:info RPC", () => {
    expect(rpcMap["system:info"]).toBeDefined();
    expect(rpcMap["system:info"].name).toBe("system:info");
  });

  it("should export rpcNames array with all tool names", () => {
    expect(rpcNames).toBeDefined();
    expect(rpcNames).toContain("db:health");
    expect(rpcNames).toContain("db:stats");
    expect(rpcNames).toContain("cache:health");
    expect(rpcNames).toContain("cache:stats");
    expect(rpcNames).toContain("system:info");
  });
});