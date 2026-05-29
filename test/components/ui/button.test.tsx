/**
 * Unit tests for Button component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Button, buttonVariants } from "~/components/ui/button";

describe("Button", () => {
  it("should render with default variant", () => {
    const html = renderToString(<Button>Click</Button>);
    expect(html).toContain("Click");
    expect(html).toContain("bg-primary");
  });

  it("should render with destructive variant", () => {
    const html = renderToString(<Button variant="destructive">Delete</Button>);
    expect(html).toContain("Delete");
    expect(html).toContain("bg-destructive");
  });

  it("should render with outline variant", () => {
    const html = renderToString(<Button variant="outline">Outline</Button>);
    expect(html).toContain("border-input");
  });

  it("should render with secondary variant", () => {
    const html = renderToString(<Button variant="secondary">Secondary</Button>);
    expect(html).toContain("bg-secondary");
  });

  it("should render with ghost variant", () => {
    const html = renderToString(<Button variant="ghost">Ghost</Button>);
    expect(html).toContain("hover:bg-accent");
  });

  it("should render with link variant", () => {
    const html = renderToString(<Button variant="link">Link</Button>);
    expect(html).toContain("text-primary");
    expect(html).toContain("hover:underline");
  });

  it("should render with small size", () => {
    const html = renderToString(<Button size="sm">Small</Button>);
    expect(html).toContain("h-9");
  });

  it("should render with large size", () => {
    const html = renderToString(<Button size="lg">Large</Button>);
    expect(html).toContain("h-11");
  });

  it("should render with icon size", () => {
    const html = renderToString(<Button size="icon">I</Button>);
    expect(html).toContain("h-10");
    expect(html).toContain("w-10");
  });

  it("should be disabled when disabled prop is true", () => {
    const html = renderToString(<Button disabled>Disabled</Button>);
    expect(html).toContain("disabled");
  });

  it("should apply custom className", () => {
    const html = renderToString(<Button className="my-btn">Custom</Button>);
    expect(html).toContain("my-btn");
  });

  it("should render as a button element", () => {
    const html = renderToString(<Button>Btn</Button>);
    expect(html).toContain("<button");
  });

  it("should export buttonVariants function", () => {
    expect(typeof buttonVariants).toBe("function");
  });
});