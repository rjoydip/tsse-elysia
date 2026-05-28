/**
 * Unit tests for Separator component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Separator } from "~/components/ui/separator";

describe("Separator", () => {
  it("should render horizontal separator by default", () => {
    const html = renderToString(<Separator />);
    expect(html).toContain("w-full");
    expect(html).toContain("h-px");
  });

  it("should render vertical separator", () => {
    const html = renderToString(<Separator orientation="vertical" />);
    expect(html).toContain("h-full");
    expect(html).toContain("w-px");
  });

  it("should have role=none when decorative (default)", () => {
    const html = renderToString(<Separator />);
    expect(html).toContain('role="none"');
  });

  it("should have role=separator when not decorative", () => {
    const html = renderToString(<Separator decorative={false} />);
    expect(html).toContain('role="separator"');
  });

  it("should set vertical data-orientation", () => {
    const html = renderToString(<Separator orientation="vertical" decorative={false} />);
    expect(html).toContain('data-orientation="vertical"');
  });

  it("should set horizontal data-orientation", () => {
    const html = renderToString(<Separator orientation="horizontal" decorative={false} />);
    expect(html).toContain('data-orientation="horizontal"');
  });

  it("should apply custom className", () => {
    const html = renderToString(<Separator className="my-sep" />);
    expect(html).toContain("my-sep");
  });

  it("should render as a div element", () => {
    const html = renderToString(<Separator />);
    expect(html).toContain("<div");
  });
});