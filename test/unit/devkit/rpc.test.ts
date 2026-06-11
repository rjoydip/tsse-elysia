/**
 * Unit tests for Devkit RPC modules.
 * Tests that RPC function definitions are valid.
 */

import { describe, it, expect } from "bun:test";
import { dbHealthRpc, dbStatsRpc } from "../../../tools/devkit/rpc/db";
import { cacheHealthRpc, cacheStatsRpc } from "../../../tools/devkit/rpc/cache";
import { systemInfoRpc } from "../../../tools/devkit/rpc/system";

describe("Devkit RPC - DB", () => {
  it("should define db:health RPC with correct structure", () => {
    expect(dbHealthRpc).toBeDefined();
    expect(dbHealthRpc.name).toBe("db:health");
    expect(dbHealthRpc.type).toBe("query");
  });

  it("should define db:stats RPC with correct structure", () => {
    expect(dbStatsRpc).toBeDefined();
    expect(dbStatsRpc.name).toBe("db:stats");
    expect(dbStatsRpc.type).toBe("query");
  });

  it("should have agent field for MCP exposure on DB RPCs", () => {
    expect(dbHealthRpc.agent).toBeDefined();
    expect(typeof dbHealthRpc.agent?.description).toBe("string");
    expect(dbStatsRpc.agent).toBeDefined();
    expect(typeof dbStatsRpc.agent?.description).toBe("string");
  });
});

describe("Devkit RPC - Cache", () => {
  it("should define cache:health RPC with correct structure", () => {
    expect(cacheHealthRpc).toBeDefined();
    expect(cacheHealthRpc.name).toBe("cache:health");
    expect(cacheHealthRpc.type).toBe("query");
  });

  it("should define cache:stats RPC with correct structure", () => {
    expect(cacheStatsRpc).toBeDefined();
    expect(cacheStatsRpc.name).toBe("cache:stats");
    expect(cacheStatsRpc.type).toBe("query");
  });

  it("should have agent field for MCP exposure on Cache RPCs", () => {
    expect(cacheHealthRpc.agent).toBeDefined();
    expect(typeof cacheHealthRpc.agent?.description).toBe("string");
    expect(cacheStatsRpc.agent).toBeDefined();
    expect(typeof cacheStatsRpc.agent?.description).toBe("string");
  });
});

describe("Devkit RPC - System", () => {
  it("should define system:info RPC with correct structure", () => {
    expect(systemInfoRpc).toBeDefined();
    expect(systemInfoRpc.name).toBe("system:info");
    expect(systemInfoRpc.type).toBe("query");
  });

  it("should have agent field for MCP exposure", () => {
    expect(systemInfoRpc.agent).toBeDefined();
    expect(typeof systemInfoRpc.agent?.description).toBe("string");
  });
});