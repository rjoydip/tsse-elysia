/**
 * Unit tests for Collapsible components
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Collapsible, CollapsibleTrigger } from "~/components/ui/collapsible";

describe("Collapsible", () => {
  it("should render Collapsible with trigger", () => {
    const html = renderToString(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(html).toContain("Toggle");
    expect(html).toContain("button");
    expect(html).toContain("data-state");
  });

  it("should render CollapsibleTrigger with button element", () => {
    const html = renderToString(
      <Collapsible>
        <CollapsibleTrigger>Click Me</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(html).toContain("Click Me");
    expect(html).toContain("button");
  });

  it("should render Collapsible with asChild on trigger", () => {
    const html = renderToString(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <span>Custom Trigger</span>
        </CollapsibleTrigger>
      </Collapsible>,
    );
    expect(html).toContain("Custom Trigger");
    expect(html).toContain("<span");
  });

  it("should render Collapsible with open prop", () => {
    const html = renderToString(
      <Collapsible open>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(html).toContain("Toggle");
    expect(html).toContain('data-state="open"');
  });

  it("should render Collapsible with defaultOpen prop", () => {
    const html = renderToString(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(html).toContain("Toggle");
  });

  it("should apply custom className to CollapsibleTrigger", () => {
    const html = renderToString(
      <Collapsible>
        <CollapsibleTrigger className="custom-trigger">Toggle</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(html).toContain("custom-trigger");
  });
});