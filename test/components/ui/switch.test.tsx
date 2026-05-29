/**
 * Unit tests for Switch component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Switch } from "~/components/ui/switch";

describe("Switch", () => {
  it("should render switch with default classes", () => {
    const html = renderToString(<Switch />);
    expect(html).toContain("h-6");
    expect(html).toContain("w-11");
  });

  it("should render with checked state classes", () => {
    const html = renderToString(<Switch checked />);
    expect(html).toContain("data-[state=checked]:bg-primary");
  });

  it("should render with unchecked state classes", () => {
    const html = renderToString(<Switch />);
    expect(html).toContain("data-[state=unchecked]:bg-input");
  });

  it("should render with custom className", () => {
    const html = renderToString(<Switch className="my-switch" />);
    expect(html).toContain("my-switch");
  });

  it("should render with thumb element", () => {
    const html = renderToString(<Switch />);
    expect(html).toContain("rounded-full");
    expect(html).toContain("h-5");
    expect(html).toContain("w-5");
  });

  it("should be disabled when disabled prop is true", () => {
    const html = renderToString(<Switch disabled />);
    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
  });
});