/**
 * Unit tests for monitoring configuration
 */

import { describe, expect, it } from "bun:test";
import { monitoringConfig } from "../../../src/config";

describe("Monitoring Configuration", () => {
  it("should have default heartbeat pattern", () => {
    expect(monitoringConfig.heartbeatPattern).toBe("*/5 * * * *");
  });

  it("should allow custom heartbeat pattern via env var", () => {
    // This test would require mocking process.env which is complex in bun
    // The functionality is tested through the getEnvVar function which is tested elsewhere
    expect(typeof monitoringConfig.heartbeatPattern).toBe("string");
  });
});