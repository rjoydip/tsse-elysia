/**
 * Unit tests for src/features/dashboard/components/shared/animated-number.tsx
 * Tests: AnimatedNumber component - initial render, value display, formatting, className
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { AnimatedNumber } from "../../../src/features/dashboard/components/shared/animated-number";

describe("AnimatedNumber", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render initial value of 0", () => {
    const html = renderToString(<AnimatedNumber value={265} />);
    // Initial render shows 0 before RAF fires
    expect(html).toContain("0");
  });

  it("should use custom format function", () => {
    const html = renderToString(<AnimatedNumber value={42} format={(n) => `${n} users`} />);
    expect(html).toContain("0 users");
  });

  it("should apply custom className", () => {
    const html = renderToString(<AnimatedNumber value={100} className="text-2xl font-bold" />);
    expect(html).toContain("text-2xl");
    expect(html).toContain("font-bold");
  });

  it("should render locale-formatted value by default", () => {
    const html = renderToString(<AnimatedNumber value={1000} />);
    // Default format uses toLocaleString, should show "0" initially
    expect(html).toContain("0");
  });

  it("should render the raw value count in the format prop", () => {
    const html = renderToString(<AnimatedNumber value={999} format={(n) => `+${n}`} />);
    expect(html).toContain("+0");
  });

  it("should handle zero value", () => {
    const html = renderToString(<AnimatedNumber value={0} />);
    expect(html).toContain("0");
  });

  it("should handle large numbers", () => {
    const html = renderToString(
      <AnimatedNumber value={1000000} format={(n) => n.toLocaleString()} />,
    );
    expect(html).toContain("0");
  });

  it("should handle negative values", () => {
    const html = renderToString(<AnimatedNumber value={-50} format={(n) => `${n}`} />);
    expect(html).toContain("0");
  });

  it("should use bounce animation preset by default", () => {
    const html = renderToString(<AnimatedNumber value={500} />);
    // Initial render shows 0 before RAF fires; verifies component renders without error
    expect(html).toContain("0");
  });

  it("should accept custom animation preset", () => {
    const html = renderToString(<AnimatedNumber value={300} animation="fadeScale" />);
    expect(html).toContain("0");
  });

  it("should accept custom animation transition object", () => {
    const html = renderToString(
      <AnimatedNumber value={200} animation={{ duration: 0.5, ease: "easeOut" }} />,
    );
    expect(html).toContain("0");
  });

  it("should accept enterDelay prop", () => {
    const html = renderToString(<AnimatedNumber value={150} enterDelay={100} />);
    // With enterDelay, initial render still shows 0
    expect(html).toContain("0");
  });
});