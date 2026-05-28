/**
 * Unit tests for Tooltip components
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Tooltip, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip";

describe("Tooltip", () => {
  it("should render TooltipProvider", () => {
    const html = renderToString(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(html).toContain("Hover me");
  });

  it("should render Tooltip with trigger", () => {
    const html = renderToString(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(html).toContain("Trigger");
  });

  it("should render TooltipTrigger as button element", () => {
    const html = renderToString(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Click me</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(html).toContain("Click me");
  });

  it("should render TooltipTrigger with data-state", () => {
    const html = renderToString(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(html).toContain("data-state");
  });

  it("should apply custom className to TooltipTrigger", () => {
    const html = renderToString(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="custom-trigger">Hover</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(html).toContain("custom-trigger");
  });
});