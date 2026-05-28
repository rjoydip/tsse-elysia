/**
 * Unit tests for DropdownMenu components
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { DropdownMenu, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";

describe("DropdownMenu", () => {
  it("should render DropdownMenu with trigger", () => {
    const html = renderToString(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      </DropdownMenu>,
    );
    expect(html).toContain("Open");
    expect(html).toContain("button");
    expect(html).toContain("aria-haspopup");
  });

  it("should render DropdownMenuTrigger as button", () => {
    const html = renderToString(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      </DropdownMenu>,
    );
    expect(html).toContain("Menu");
    expect(html).toContain("button");
  });

  it("should apply custom className to DropdownMenuTrigger", () => {
    const html = renderToString(
      <DropdownMenu>
        <DropdownMenuTrigger className="custom-trigger">Menu</DropdownMenuTrigger>
      </DropdownMenu>,
    );
    expect(html).toContain("custom-trigger");
  });

  it("should render DropdownMenuTrigger with data-state", () => {
    const html = renderToString(
      <DropdownMenu>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
      </DropdownMenu>,
    );
    expect(html).toContain("data-state");
  });
});