import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";
import { rmSync } from "fs";
import { EmailRenderService, escapeHtml } from "~/services/email/render.service";

/**
 * Unit tests for the EmailRenderService.
 * Uses temporary directories to simulate the Maizzle build output.
 */
describe("EmailRenderService", () => {
  let tempDir: string;
  let service: EmailRenderService;

  beforeEach(() => {
    // Create a temporary build directory for each test
    tempDir = mkdtempSync(resolve(tmpdir(), "email-test-"));
    service = new EmailRenderService(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("render", () => {
    it("should return 404 for unknown template", () => {
      const result = service.render("nonexistent", { test: "value" });

      if (result.ok) {
        // Should not reach here
        expect.unreachable();
      } else {
        expect(result.status).toBe(404);
        expect(result.error).toContain('Template "nonexistent" not found');
      }
    });

    it("should return rendered HTML with variables substituted", () => {
      // Create a mock build output
      writeFileSync(
        resolve(tempDir, "welcome.html"),
        "<h1>Welcome, {= username =}!</h1>\n<p>Your dashboard: {= dashboardUrl =}</p>",
        "utf-8",
      );

      const result = service.render("welcome", {
        username: "Jane",
        dashboardUrl: "https://example.com/dashboard",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.html).toContain("Welcome, Jane!");
        expect(result.html).toContain("https://example.com/dashboard");
      }
    });

    it("should escape HTML in variable values", () => {
      writeFileSync(resolve(tempDir, "test.html"), "<p>{= content =}</p>", "utf-8");

      const result = service.render("test", {
        content: '<script>alert("xss")</script>',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.html).toContain("&lt;script&gt;");
        expect(result.html).not.toContain("<script>");
      }
    });

    it("should replace variables in HTML attributes", () => {
      writeFileSync(resolve(tempDir, "test.html"), '<a href="{= url =}">Click here</a>', "utf-8");

      const result = service.render("test", {
        url: "https://example.com",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.html).toContain('href="https://example.com"');
      }
    });

    it("should replace unknown variables with empty string", () => {
      writeFileSync(resolve(tempDir, "test.html"), "<p>{= known =} {= unknown =}</p>", "utf-8");

      const result = service.render("test", {
        known: "hello",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Known variable is replaced
        expect(result.html).toContain("hello");
        // Unknown variable is replaced with empty string
        expect(result.html).not.toContain("{= unknown =}");
      }
    });

    it("should handle multiple occurrences of the same variable", () => {
      writeFileSync(
        resolve(tempDir, "test.html"),
        "<p>{= name =}</p>\n<p>{= name =}</p>\n<p>{= name =}</p>",
        "utf-8",
      );

      const result = service.render("test", {
        name: "Alice",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const matches = result.html.match(/Alice/g);
        expect(matches).toHaveLength(3);
      }
    });

    it("should handle empty data object gracefully", () => {
      writeFileSync(resolve(tempDir, "test.html"), "<p>{= var =}</p>", "utf-8");

      const result = service.render("test", {});

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Variable should be replaced with empty string
        expect(result.html).not.toContain("{= var =}");
        expect(result.html).toBe("<p></p>");
      }
    });

    it("should handle template with no variables", () => {
      writeFileSync(resolve(tempDir, "static.html"), "<h1>Static content</h1>", "utf-8");

      const result = service.render("static", { unused: "value" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.html).toBe("<h1>Static content</h1>");
      }
    });

    it("should return 500 for file read errors", () => {
      // Create a directory with the template name so readFileSync throws EISDIR
      mkdirSync(resolve(tempDir, "broken.html"));

      const result = service.render("broken", { x: "y" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(500);
        expect(result.error).toContain("Failed to render template");
      }
    });
  });

  describe("escapeHtml", () => {
    it("should escape & to &amp;", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("should escape < to &lt;", () => {
      expect(escapeHtml("<tag>")).toBe("&lt;tag&gt;");
    });

    it("should escape > to &gt;", () => {
      expect(escapeHtml("a > b")).toBe("a &gt; b");
    });

    it("should escape double quotes to &quot;", () => {
      expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
    });

    it("should escape single quotes to &#039;", () => {
      expect(escapeHtml("it's")).toBe("it&#039;s");
    });

    it("should handle strings with no special characters", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
    });

    it("should handle empty string", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("listTemplates", () => {
    it("should return empty array for non-existent build directory", () => {
      const emptyService = new EmailRenderService("/nonexistent/path");
      expect(emptyService.listTemplates()).toEqual([]);
    });

    it("should list available templates without extensions", () => {
      writeFileSync(resolve(tempDir, "welcome.html"), "content", "utf-8");
      writeFileSync(resolve(tempDir, "verify-email.html"), "content", "utf-8");
      writeFileSync(resolve(tempDir, "password-reset.html"), "content", "utf-8");

      const templates = service.listTemplates();
      expect(templates).toHaveLength(3);
      expect(templates).toContain("welcome");
      expect(templates).toContain("verify-email");
      expect(templates).toContain("password-reset");
    });

    it("should only include .html files, not .txt files", () => {
      writeFileSync(resolve(tempDir, "welcome.html"), "content", "utf-8");
      writeFileSync(resolve(tempDir, "welcome.txt"), "content", "utf-8");

      const templates = service.listTemplates();
      expect(templates).toEqual(["welcome"]);
    });
  });
});