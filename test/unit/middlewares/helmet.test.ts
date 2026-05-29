/**
 * Unit tests for src/middlewares/helmet.ts
 * Tests: security headers middleware configuration
 */

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { Elysia } from "elysia";
import { helmet } from "~/middlewares/helmet";
import { helmetConfig } from "~/config";

describe("helmet middleware", () => {
  let app: Elysia;

  beforeEach(() => {
    app = new Elysia().use(helmet);
  });

  afterEach(() => {
    app = undefined as unknown as Elysia;
  });

  it("should be defined as Elysia instance", () => {
    expect(helmet).toBeInstanceOf(Elysia);
  });

  it("should set X-Content-Type-Options when contentSecurityPolicy is enabled", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    if (helmetConfig.contentSecurityPolicy) {
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    }
  });

  it("should set X-Frame-Options when xFrameOptions is enabled", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    if (helmetConfig.xFrameOptions) {
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    }
  });

  it("should set X-XSS-Protection when xXssProtection is enabled", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    if (helmetConfig.xXssProtection) {
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    }
  });

  it("should set Strict-Transport-Security when strictTransportSecurity is enabled", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    if (helmetConfig.strictTransportSecurity) {
      expect(response.headers.get("Strict-Transport-Security")).toBe(
        "max-age=31536000; includeSubDomains",
      );
    }
  });

  it("should set X-Powered-By when xPoweredBy is enabled", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    if (helmetConfig.xPoweredBy) {
      expect(response.headers.get("X-Powered-By")).toBe("Elysia");
    }
  });

  it("should set Referrer-Policy when referrerPolicy is enabled", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    if (helmetConfig.referrerPolicy) {
      expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    }
  });

  it("should set X-Permitted-Cross-Domain-Policies when xPermittedCrossDomainPolicies is enabled", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "GET" }));
    if (helmetConfig.xPermittedCrossDomainPolicies) {
      expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toBe("none");
    }
  });
});