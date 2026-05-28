/**
 * Unit tests for MCP API key utilities.
 * Tests key generation, hashing, and validation logic.
 */

import { describe, it, expect } from "bun:test";
import { generateApiKey, hashKey } from "~/lib/mcp/api-keys";

describe("API Key Generation", () => {
  it("should generate key with mcp_ prefix", () => {
    const key = generateApiKey();

    expect(key).toStartWith("mcp_");
  });

  it("should generate unique keys", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();

    expect(key1).not.toBe(key2);
  });

  it("should generate key of sufficient length", () => {
    const key = generateApiKey();

    // mcp_ (4) + 64 hex chars (32 bytes * 2)
    expect(key.length).toBe(68);
  });

  it("should only contain hex characters after prefix", () => {
    const key = generateApiKey();
    const hexPart = key.slice(4);

    expect(hexPart).toMatch(/^[a-f0-9]+$/);
  });
});

describe("API Key Hashing", () => {
  it("should produce consistent hash for same input", () => {
    const key = "test-key";
    const hash1 = hashKey(key);
    const hash2 = hashKey(key);

    expect(hash1).toBe(hash2);
  });

  it("should produce different hash for different inputs", () => {
    const hash1 = hashKey("key-1");
    const hash2 = hashKey("key-2");

    expect(hash1).not.toBe(hash2);
  });

  it("should produce 64-character hex string (SHA-256)", () => {
    const hash = hashKey("test");

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("should be irreversible (one-way)", () => {
    const key = "my-secret-key";
    const hash = hashKey(key);

    // Hash should not contain the original key
    expect(hash).not.toContain("my-secret");
  });
});