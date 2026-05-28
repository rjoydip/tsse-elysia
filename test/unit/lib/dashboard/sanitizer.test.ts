/**
 * Unit tests for src/lib/dashboard/sanitizer.ts
 * Tests XSS prevention functions.
 */

import { describe, expect, it } from "bun:test";
import {
  sanitizeContent,
  stripHtml,
  validateContent,
  sanitizeMessage,
} from "~/lib/dashboard/sanitizer";

describe("sanitizeContent", () => {
  it("should remove script tags and escape remaining content", () => {
    const result = sanitizeContent("<script>alert('xss')</script>");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
    expect(result).not.toContain("<script>");
  });

  it("should escape HTML special characters", () => {
    expect(sanitizeContent("&lt;")).toBe("&amp;lt;");
    expect(sanitizeContent("&gt;")).toBe("&amp;gt;");
  });

  it("should remove javascript: URLs", () => {
    expect(sanitizeContent("javascript:alert(1)")).toBe("javascript:_blocked_alert(1)");
    expect(sanitizeContent("vbscript:msgbox('xss')")).toBe(
      "vbscript:_blocked_msgbox(&#x27;xss&#x27;)",
    );
  });

  it("should remove data: URLs", () => {
    const result = sanitizeContent("data:text/html,<script>alert(1)</script>");
    expect(result).toContain("blocked:");
    expect(result).not.toContain("data:");
  });

  it("should remove dangerous HTML tags", () => {
    expect(sanitizeContent("<script>alert(1)</script>")).not.toContain("<script>");
    expect(sanitizeContent("<iframe src='evil.com'></iframe>")).not.toContain("<iframe");
  });

  it("should remove event handler attributes", () => {
    const result = sanitizeContent('<div onclick="alert(1)">Click</div>');
    expect(result).not.toContain("onclick=");
    expect(result).not.toContain('onclick="');
  });

  it("should handle safe content without modification", () => {
    expect(sanitizeContent("Hello, World!")).toBe("Hello, World!");
    expect(sanitizeContent("No special characters here")).toBe("No special characters here");
  });

  it("should handle empty string", () => {
    expect(sanitizeContent("")).toBe("");
  });

  it("should handle non-string input gracefully", () => {
    expect(sanitizeContent(null as unknown as string)).toBe("");
    expect(sanitizeContent(undefined as unknown as string)).toBe("");
  });

  it("should handle complex XSS payloads", () => {
    const xssPayload = "<script>document.write('<img src=x onerror=alert(1)>')</script>";
    const sanitized = sanitizeContent(xssPayload);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("<script>");
  });

  it("should handle mixed safe and unsafe content", () => {
    const mixed = "Hello <b>World</b> and <script>alert(1)</script>";
    const sanitized = sanitizeContent(mixed);
    expect(sanitized).toContain("Hello");
    expect(sanitized).toContain("&lt;b&gt;");
    expect(sanitized).not.toContain("<script>");
  });
});

describe("stripHtml", () => {
  it("should remove all HTML tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
    expect(stripHtml("<div><span>Nested</span></div>")).toBe("Nested");
  });

  it("should handle content without HTML tags", () => {
    expect(stripHtml("Plain text")).toBe("Plain text");
  });

  it("should handle self-closing tags", () => {
    expect(stripHtml("Before<br/>After")).toBe("BeforeAfter");
    expect(stripHtml("Text<hr>More")).toBe("TextMore");
  });

  it("should handle complex nested structures", () => {
    expect(stripHtml("<table><tr><td>Cell</td></tr></table>")).toBe("Cell");
  });
});

describe("validateContent", () => {
  it("should return true for safe content", () => {
    expect(validateContent("Hello, World!")).toBe(true);
    expect(validateContent("Plain text content")).toBe(true);
    expect(validateContent("Numbers 123 and symbols !@#$")).toBe(true);
  });

  it("should return false for script tags", () => {
    expect(validateContent("<script>alert(1)</script>")).toBe(false);
    expect(validateContent("<SCRIPT>alert('xss')</SCRIPT>")).toBe(false);
  });

  it("should return false for javascript: URLs", () => {
    expect(validateContent("javascript:alert(1)")).toBe(false);
    expect(validateContent("href='javascript:alert(1)'")).toBe(false);
  });

  it("should return false for event handlers", () => {
    expect(validateContent('onclick="alert(1)"')).toBe(false);
    expect(validateContent("onerror=alert(1)")).toBe(false);
    expect(validateContent('onload="xss"')).toBe(false);
  });

  it("should return false for iframe tags", () => {
    expect(validateContent("<iframe src='evil.com'></iframe>")).toBe(false);
    expect(validateContent("<IFRAME>Content</IFRAME>")).toBe(false);
  });

  it("should return false for object tags", () => {
    expect(validateContent("<object data='evil.swf'></object>")).toBe(false);
  });

  it("should return false for embed tags", () => {
    expect(validateContent("<embed src='evil.swf'>")).toBe(false);
  });

  it("should return false for data: URLs", () => {
    expect(validateContent("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("should return false for vbscript URLs", () => {
    expect(validateContent("vbscript:msgbox('xss')")).toBe(false);
  });

  it("should return true for content with escaped characters", () => {
    expect(validateContent("&lt;script&gt;")).toBe(true);
    expect(validateContent("&amp; and other entities")).toBe(true);
  });
});

describe("sanitizeMessage", () => {
  it("should sanitize specified fields in a message object", () => {
    const message = {
      content: "<script>alert(1)</script>",
      author: "User",
      timestamp: "2024-01-01",
    };
    const sanitized = sanitizeMessage(message, ["content"]);
    expect(sanitized.content).not.toContain("<script>");
    expect(sanitized.author).toBe("User");
  });

  it("should sanitize multiple fields", () => {
    const message = {
      title: "<b>Title</b>",
      body: "<script>alert(1)</script>",
      id: "123",
    };
    const sanitized = sanitizeMessage(message, ["title", "body"]);
    expect(sanitized.title).toContain("&lt;b&gt;");
    expect(sanitized.body).not.toContain("<script>");
    expect(sanitized.id).toBe("123");
  });

  it("should handle non-string fields gracefully", () => {
    const message = {
      id: 123,
      count: 42,
    };
    const sanitized = sanitizeMessage(message, ["id", "count"]);
    expect(sanitized.id).toBe(123);
    expect(sanitized.count).toBe(42);
  });

  it("should not mutate the original message", () => {
    const message = {
      content: "Original <script>alert(1)</script>",
    };
    const originalContent = message.content;
    sanitizeMessage(message, ["content"]);
    expect(message.content).toBe(originalContent);
  });

  it("should handle empty fields array", () => {
    const message = {
      content: "<script>alert(1)</script>",
      author: "User",
    };
    const sanitized = sanitizeMessage(message, []);
    expect(sanitized.content).toBe(message.content);
    expect(sanitized.author).toBe("User");
  });
});