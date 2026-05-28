/**
 * Unit tests for Badge component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Badge, badgeVariants } from "~/components/ui/badge";

describe("Badge", () => {
  it("should render with default variant", () => {
    const html = renderToString(<Badge>Test</Badge>);
    expect(html).toContain("Test");
    expect(html).toContain("rounded-full");
  });

  it("should render with secondary variant", () => {
    const html = renderToString(<Badge variant="secondary">Secondary</Badge>);
    expect(html).toContain("Secondary");
    expect(html).toContain("bg-secondary");
  });

  it("should render with destructive variant", () => {
    const html = renderToString(<Badge variant="destructive">Error</Badge>);
    expect(html).toContain("Error");
    expect(html).toContain("bg-destructive");
  });

  it("should render with outline variant", () => {
    const html = renderToString(<Badge variant="outline">Outline</Badge>);
    expect(html).toContain("Outline");
    expect(html).toContain("text-foreground");
  });

  it("should apply custom className", () => {
    const html = renderToString(<Badge className="custom-class">Custom</Badge>);
    expect(html).toContain("custom-class");
  });

  it("should render as a div element", () => {
    const html = renderToString(<Badge>Div</Badge>);
    expect(html).toContain("<div");
  });

  it("should forward additional HTML attributes", () => {
    const html = renderToString(<Badge data-testid="badge">Attr</Badge>);
    expect(html).toContain('data-testid="badge"');
  });

  it("should export badgeVariants function", () => {
    expect(typeof badgeVariants).toBe("function");
  });
});