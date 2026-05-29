/**
 * Unit tests for Skeleton component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Skeleton } from "~/components/ui/skeleton";

describe("Skeleton", () => {
  it("should render skeleton with default classes", () => {
    const html = renderToString(<Skeleton />);
    expect(html).toContain("animate-pulse");
    expect(html).toContain("rounded-md");
    expect(html).toContain("bg-muted");
  });

  it("should render with custom className", () => {
    const html = renderToString(<Skeleton className="my-skeleton" />);
    expect(html).toContain("my-skeleton");
  });

  it("should render as a div element", () => {
    const html = renderToString(<Skeleton />);
    expect(html).toContain("<div");
  });

  it("should render with custom dimensions via className", () => {
    const html = renderToString(<Skeleton className="h-4 w-full" />);
    expect(html).toContain("h-4");
    expect(html).toContain("w-full");
  });
});