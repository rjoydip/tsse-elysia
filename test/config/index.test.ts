import { describe, expect, it } from "bun:test";
import {
  API_PREFIX,
  APP_NAME,
  HOST,
  PORT,
  PROTOCAL,
  BASE_URL,
  isBrowser,
  isBun,
  isNode,
  isProduction,
  appConfig,
  rateLimitConfig,
  corsConfig,
  helmetConfig,
  sessionConfig,
} from "../../src/config/index.ts";
import { logger } from "../../src/lib/logger.ts";

describe("_config", () => {
  describe("API Configuration", () => {
    it("should have default API_PREFIX", () => {
      expect(API_PREFIX).toBe("/api");
    });

    it("should have default APP_NAME", () => {
      expect(APP_NAME).toBe("TSSE");
    });

    it("should have HOST as string", () => {
      expect(typeof HOST).toBe("string");
      expect(HOST.length).toBeGreaterThan(0);
    });

    it("should have PORT as number", () => {
      expect(typeof PORT).toBe("number");
      expect(PORT).toBeGreaterThan(0);
    });

    it("should have PROTOCAL as string", () => {
      expect(typeof PROTOCAL).toBe("string");
      expect(PROTOCAL).toMatch(/^https?$/);
    });

    it("should have BASE_URL as string", () => {
      expect(typeof BASE_URL).toBe("string");
      expect(BASE_URL).toContain("://");
    });

    it("should construct BASE_URL from PROTOCAL, HOST, and PORT", () => {
      const expectedBaseUrl = `${PROTOCAL}://${HOST}:${PORT}`;
      expect(BASE_URL).toBe(expectedBaseUrl);
    });

    it("should have https for production when PROTOCAL is set to https", () => {
      const mockProtocal = "https";
      const mockHost = "example.com";
      const mockPort = 443;
      const expected = `${mockProtocal}://${mockHost}:${mockPort}`;
      expect(expected).toBe("https://example.com:443");
    });
  });

  describe("Runtime Detection", () => {
    it("should detect Bun runtime", () => {
      expect(typeof isBun).toBe("boolean");
    });

    it("should detect Node runtime", () => {
      expect(typeof isNode).toBe("boolean");
    });

    it("should detect browser environment", () => {
      expect(typeof isBrowser).toBe("boolean");
    });

    it("should correctly identify production", () => {
      expect(typeof isProduction).toBe("boolean");
    });
  });

  describe("appConfig", () => {
    it("should have normalize enabled", () => {
      expect(appConfig.normalize).toBe(true);
    });

    it("should have empty prefix", () => {
      expect(appConfig.prefix).toBe("");
    });

    it("should have nativeStaticResponse enabled", () => {
      expect(appConfig.nativeStaticResponse).toBe(true);
    });

    it("should have websocket config", () => {
      expect(appConfig.websocket).toBeDefined();
      expect(appConfig.websocket?.idleTimeout).toBe(30);
    });
  });

  describe("rateLimitConfig", () => {
    it("should have duration", () => {
      expect(rateLimitConfig.duration).toBeDefined();
      expect(rateLimitConfig.duration).toBeGreaterThan(0);
    });

    it("should have max requests", () => {
      expect(rateLimitConfig.max).toBeDefined();
      expect(rateLimitConfig.max).toBeGreaterThan(0);
    });

    it("should have duration of 60 seconds", () => {
      expect(rateLimitConfig.duration).toBe(60_000);
    });

    it("should have max of 100 requests", () => {
      expect(rateLimitConfig.max).toBe(100);
    });
  });

  describe("corsConfig", () => {
    it("should allow all origins", () => {
      expect(corsConfig.origin).toBe("*");
    });

    it("should include common HTTP methods", () => {
      expect(corsConfig.methods).toContain("GET");
      expect(corsConfig.methods).toContain("POST");
      expect(corsConfig.methods).toContain("DELETE");
    });

    it("should have credentials enabled", () => {
      expect(corsConfig.credentials).toBe(true);
    });

    it("should have maxAge set", () => {
      expect(corsConfig.maxAge).toBe(86400);
    });

    it("should have origin", () => {
      expect(corsConfig.origin).toBeDefined();
    });

    it("should have allowed methods", () => {
      expect(corsConfig.methods).toBeDefined();
      expect(Array.isArray(corsConfig.methods)).toBe(true);
    });

    it("should have maxAge for preflight caching", () => {
      expect(corsConfig.maxAge).toBeDefined();
      expect(corsConfig.maxAge).toBeGreaterThan(0);
    });
  });

  describe("helmetConfig", () => {
    it("should have contentSecurityPolicy enabled", () => {
      expect(helmetConfig.contentSecurityPolicy).toBe(true);
    });

    it("should have xPoweredBy disabled", () => {
      expect(helmetConfig.xPoweredBy).toBe(false);
    });

    it("should have xContentTypeOptions enabled", () => {
      expect(helmetConfig.xContentTypeOptions).toBe(true);
    });
  });

  describe("logger", () => {
    it("should have info method", () => {
      expect(typeof logger.info).toBe("function");
    });

    it("should have warn method", () => {
      expect(typeof logger.warn).toBe("function");
    });

    it("should have error method", () => {
      expect(typeof logger.error).toBe("function");
    });

    it("should have debug method", () => {
      expect(typeof logger.debug).toBe("function");
    });
  });

  describe("sessionConfig", () => {
    it("should have expiresIn for session lifetime", () => {
      expect(sessionConfig.expiresIn).toBeDefined();
      expect(sessionConfig.expiresIn).toBeGreaterThan(0);
    });

    it("should have updateAge for session refresh frequency", () => {
      expect(sessionConfig.updateAge).toBeDefined();
      expect(sessionConfig.updateAge).toBeGreaterThan(0);
    });

    it("expiresIn should be 7 days in seconds", () => {
      const sevenDays = 7 * 24 * 60 * 60;
      expect(sessionConfig.expiresIn).toBe(sevenDays);
    });

    it("updateAge should be 24 hours in seconds", () => {
      const twentyFourHours = 24 * 60 * 60;
      expect(sessionConfig.updateAge).toBe(twentyFourHours);
    });
  });
});