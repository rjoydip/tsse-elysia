/**
 * Unit tests for DirectionProvider context.
 * Tests direction (LTR/RTL) management.
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { DirectionProvider, useDirection } from "~/context/direction-provider";

describe("DirectionProvider", () => {
  it("should render children without crashing", () => {
    const html = renderToString(
      <DirectionProvider>
        <div>direction content</div>
      </DirectionProvider>,
    );
    expect(html).toContain("direction content");
  });

  it("should render multiple children", () => {
    const html = renderToString(
      <DirectionProvider>
        <div>first</div>
        <div>second</div>
      </DirectionProvider>,
    );
    expect(html).toContain("first");
    expect(html).toContain("second");
  });
});

describe("useDirection hook", () => {
  it("should throw error when used outside DirectionProvider", () => {
    expect(() => {
      function TestComponent() {
        useDirection();
        return null;
      }
      renderToString(<TestComponent />);
    }).toThrow();
  });

  it("should provide direction context inside DirectionProvider", () => {
    function TestComponent() {
      const { dir } = useDirection();
      return <div data-dir={dir}>direction</div>;
    }

    const html = renderToString(
      <DirectionProvider>
        <TestComponent />
      </DirectionProvider>,
    );
    expect(html).toContain("direction");
  });

  it("should provide setDir function", () => {
    function TestComponent() {
      const { setDir } = useDirection();
      return <div>{typeof setDir}</div>;
    }

    const html = renderToString(
      <DirectionProvider>
        <TestComponent />
      </DirectionProvider>,
    );
    expect(html).toContain("function");
  });

  it("should provide resetDir function", () => {
    function TestComponent() {
      const { resetDir } = useDirection();
      return <div>{typeof resetDir}</div>;
    }

    const html = renderToString(
      <DirectionProvider>
        <TestComponent />
      </DirectionProvider>,
    );
    expect(html).toContain("function");
  });

  it("should provide defaultDir value", () => {
    function TestComponent() {
      const { defaultDir, dir } = useDirection();
      return (
        <div data-default={defaultDir} data-current={dir}>
          direction
        </div>
      );
    }

    const html = renderToString(
      <DirectionProvider>
        <TestComponent />
      </DirectionProvider>,
    );
    expect(html).toContain("direction");
  });

  it("should have LTR as default direction", () => {
    function TestComponent() {
      const { dir } = useDirection();
      return <div>{dir === "ltr" ? "correct" : "wrong"}</div>;
    }

    const html = renderToString(
      <DirectionProvider>
        <TestComponent />
      </DirectionProvider>,
    );
    expect(html).toContain("correct");
  });
});

describe("Direction values", () => {
  it("should support LTR direction", () => {
    function TestComponent() {
      const { dir } = useDirection();
      return <div>{dir}</div>;
    }

    const html = renderToString(
      <DirectionProvider>
        <TestComponent />
      </DirectionProvider>,
    );
    expect(html).toContain("ltr");
  });
});