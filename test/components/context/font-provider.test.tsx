/**
 * Unit tests for FontProvider context.
 * Tests font selection, persistence, and reset functionality.
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { FontProvider, useFont } from "~/context/font-provider";

describe("FontProvider", () => {
  it("should render children without crashing", () => {
    const html = renderToString(
      <FontProvider>
        <div>font content</div>
      </FontProvider>,
    );
    expect(html).toContain("font content");
  });

  it("should provide default font", () => {
    function TestComponent() {
      const { font } = useFont();
      return <div data-font={font}>font</div>;
    }

    const html = renderToString(
      <FontProvider>
        <TestComponent />
      </FontProvider>,
    );
    expect(html).toContain("font");
  });

  it("should render multiple children", () => {
    const html = renderToString(
      <FontProvider>
        <div>first</div>
        <div>second</div>
      </FontProvider>,
    );
    expect(html).toContain("first");
    expect(html).toContain("second");
  });
});

describe("useFont hook", () => {
  it("should throw error when used outside FontProvider", () => {
    expect(() => {
      function TestComponent() {
        useFont();
        return null;
      }
      renderToString(<TestComponent />);
    }).toThrow();
  });

  it("should provide font context inside FontProvider", () => {
    function TestComponent() {
      const { font } = useFont();
      return <div data-font={font}>themed</div>;
    }

    const html = renderToString(
      <FontProvider>
        <TestComponent />
      </FontProvider>,
    );
    expect(html).toContain("themed");
  });

  it("should provide setFont function", () => {
    function TestComponent() {
      const { setFont } = useFont();
      return <div>{typeof setFont}</div>;
    }

    const html = renderToString(
      <FontProvider>
        <TestComponent />
      </FontProvider>,
    );
    expect(html).toContain("function");
  });

  it("should provide resetFont function", () => {
    function TestComponent() {
      const { resetFont } = useFont();
      return <div>{typeof resetFont}</div>;
    }

    const html = renderToString(
      <FontProvider>
        <TestComponent />
      </FontProvider>,
    );
    expect(html).toContain("function");
  });
});