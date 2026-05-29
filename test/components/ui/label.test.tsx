/**
 * Unit tests for Label component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Label } from "~/components/ui/label";

describe("Label", () => {
  it("should render label with correct classes", () => {
    const html = renderToString(<Label>Label</Label>);
    expect(html).toContain("Label");
    expect(html).toContain("text-sm");
    expect(html).toContain("font-medium");
  });

  it("should render with custom className", () => {
    const html = renderToString(<Label className="custom-label">Custom</Label>);
    expect(html).toContain("custom-label");
  });

  it("should render with htmlFor attribute", () => {
    const html = renderToString(<Label htmlFor="test-input">Label</Label>);
    expect(html).toContain('for="test-input"');
  });

  it("should render as label element", () => {
    const html = renderToString(<Label>Test</Label>);
    expect(html).toContain("<label");
  });
});