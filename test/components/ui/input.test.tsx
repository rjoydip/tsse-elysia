/**
 * Unit tests for Input component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Input } from "~/components/ui/input";

describe("Input", () => {
  it("should render input with default classes", () => {
    const html = renderToString(<Input />);
    expect(html).toContain("<input");
    expect(html).toContain("h-10");
    expect(html).toContain("w-full");
    expect(html).toContain("border");
  });

  it("should render with placeholder text", () => {
    const html = renderToString(<Input placeholder="Enter text" />);
    expect(html).toContain('placeholder="Enter text"');
  });

  it("should render with custom className", () => {
    const html = renderToString(<Input className="my-input" />);
    expect(html).toContain("my-input");
  });

  it("should render with type password", () => {
    const html = renderToString(<Input type="password" />);
    expect(html).toContain('type="password"');
  });

  it("should render with type email", () => {
    const html = renderToString(<Input type="email" />);
    expect(html).toContain('type="email"');
  });

  it("should be disabled when disabled prop is true", () => {
    const html = renderToString(<Input disabled />);
    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
  });

  it("should accept custom type", () => {
    const html = renderToString(<Input type="number" />);
    expect(html).toContain('type="number"');
  });
});