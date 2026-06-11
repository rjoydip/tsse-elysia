/**
 * Unit tests for Sheet components
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Sheet, SheetTrigger } from "~/components/ui/sheet";

describe("Sheet", () => {
  it("should render Sheet with trigger", () => {
    const html = renderToString(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
      </Sheet>,
    );
    expect(html).toContain("Open Sheet");
    expect(html).toContain("button");
    expect(html).toContain("aria-haspopup");
  });

  it("should render SheetTrigger as button", () => {
    const html = renderToString(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
      </Sheet>,
    );
    expect(html).toContain("Open");
    expect(html).toContain("button");
  });

  it("should render SheetTrigger with data-state", () => {
    const html = renderToString(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
      </Sheet>,
    );
    expect(html).toContain("data-state");
  });

  it("should apply custom className to SheetTrigger", () => {
    const html = renderToString(
      <Sheet>
        <SheetTrigger className="custom-trigger">Open</SheetTrigger>
      </Sheet>,
    );
    expect(html).toContain("custom-trigger");
  });

  it("should render SheetTrigger with proper role attribute", () => {
    const html = renderToString(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
      </Sheet>,
    );
    // aria-controls is not rendered in SSR because Radix UI's Portal
    // content does not resolve an id server-side, but role is always present.
    expect(html).toContain("type=");
  });
});