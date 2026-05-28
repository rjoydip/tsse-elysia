/**
 * Unit tests for src/components/footer.tsx
 * Tests: Footer rendering, links, dynamic year, options
 */

import { describe, expect, it, mock } from "bun:test";
import { renderToString } from "react-dom/server";
import { Footer } from "~/components/layout/landing/footer";

// Mock auth client
let mockSession: any = null;
let mockIsPending = false;
mock.module("~/lib/auth/client", () => ({
  useSession: () => ({ data: mockSession, isPending: mockIsPending }),
}));

// Mock TanStack Router's Link component
mock.module("@tanstack/react-router", () => ({
  Link: ({ to, children, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe("Footer", () => {
  it("should render without crashing", () => {
    const html = renderToString(<Footer />);
    expect(html).toContain("<footer");
  });

  it("should render Documentation link", () => {
    const html = renderToString(<Footer />);
    expect(html).toContain("Documentation");
    expect(html).toContain('href="/docs"');
  });

  it("should render Blog link", () => {
    const html = renderToString(<Footer />);
    expect(html).toContain("Blog");
    expect(html).toContain('href="/blog"');
  });

  it("should render Changelog link", () => {
    const html = renderToString(<Footer />);
    expect(html).toContain("Changelog");
    expect(html).toContain('href="/changelog"');
  });

  it("should render Status link", () => {
    const html = renderToString(<Footer />);
    expect(html).toContain("Status");
    expect(html).toContain('href="/status"');
  });

  it("should render GitHub link", () => {
    const html = renderToString(<Footer />);
    expect(html).toContain("GitHub");
    expect(html).toContain("github.com");
  });

  it("should render current year in copyright", () => {
    const html = renderToString(<Footer />);
    const currentYear = new Date().getFullYear().toString();
    expect(html).toContain(currentYear);
  });

  it("should render app name in copyright", () => {
    const html = renderToString(<Footer />);
    expect(html).toContain("TSSE");
  });

  it("should apply custom className", () => {
    const html = renderToString(<Footer className="custom-footer" />);
    expect(html).toContain("custom-footer");
  });

  it("should have status pulse indicator", () => {
    const html = renderToString(<Footer />);
    expect(html).toContain("animate-pulse");
  });

  it("should have all links as anchor elements", () => {
    const html = renderToString(<Footer />);
    const linkCount = (html.match(/<a /g) || []).length;
    expect(linkCount).toBeGreaterThanOrEqual(5);
  });

  it("should show terms when showTerms is true", () => {
    const html = renderToString(<Footer showTerms={true} />);
    expect(html).toContain("Terms of Service");
    expect(html).toContain("Privacy Policy");
  });

  it("should hide terms when showTerms is false", () => {
    const html = renderToString(<Footer showTerms={false} />);
    expect(html).not.toContain("Terms of Service");
  });

  it("should show logo when showLogo is true (default)", () => {
    const html = renderToString(<Footer showLogo={true} />);
    expect(html).toContain("TSSE");
  });

  it("should hide logo when showLogo is false", () => {
    const html = renderToString(<Footer showLogo={false} />);
    // Logo section should be empty - app name should not appear in logo area
    expect(html).not.toContain("TSSE</span>");
  });

  describe("Authentication States", () => {
    it("should render content when user is not logged in", () => {
      mockIsPending = false;
      mockSession = null;
      const html = renderToString(<Footer />);
      expect(html).toContain("<footer");
      expect(html).toContain("Documentation");
    });

    it("should return null (empty string) when user is logged in", () => {
      mockIsPending = false;
      mockSession = { user: { id: "1", name: "Test User" } };
      const html = renderToString(<Footer />);
      expect(html).toBe("");
    });

    it("should render content while user check is pending", () => {
      mockIsPending = true;
      mockSession = null;
      const html = renderToString(<Footer />);
      expect(html).toContain("<footer");
      expect(html).toContain("Documentation");
    });
  });
});