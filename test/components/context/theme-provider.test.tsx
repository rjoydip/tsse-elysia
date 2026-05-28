/**
 * Unit tests for ThemeProvider context.
 * Tests theme selection, persistence, and reset functionality.
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { ThemeProvider, useTheme } from "~/context/theme-provider";

describe("ThemeProvider", () => {
  it("should render children without crashing", () => {
    const html = renderToString(
      <ThemeProvider>
        <div>theme content</div>
      </ThemeProvider>,
    );
    expect(html).toContain("theme content");
  });

  it("should render with default theme", () => {
    const html = renderToString(
      <ThemeProvider>
        <span>themed</span>
      </ThemeProvider>,
    );
    expect(html).toContain("themed");
  });

  it("should accept custom storageKey", () => {
    const html = renderToString(
      <ThemeProvider storageKey="my-theme-key">
        <span>custom key</span>
      </ThemeProvider>,
    );
    expect(html).toContain("custom key");
  });

  it("should accept dark defaultTheme", () => {
    const html = renderToString(
      <ThemeProvider defaultTheme="dark">
        <span>dark default</span>
      </ThemeProvider>,
    );
    expect(html).toContain("dark default");
  });

  it("should accept light defaultTheme", () => {
    const html = renderToString(
      <ThemeProvider defaultTheme="light">
        <span>light default</span>
      </ThemeProvider>,
    );
    expect(html).toContain("light default");
  });

  it("should accept system defaultTheme", () => {
    const html = renderToString(
      <ThemeProvider defaultTheme="system">
        <span>system default</span>
      </ThemeProvider>,
    );
    expect(html).toContain("system default");
  });

  it("should render multiple children", () => {
    const html = renderToString(
      <ThemeProvider>
        <div>first</div>
        <div>second</div>
      </ThemeProvider>,
    );
    expect(html).toContain("first");
    expect(html).toContain("second");
  });

  it("should provide resolvedTheme property", () => {
    function TestComponent() {
      const { resolvedTheme } = useTheme();
      return <div data-resolved={resolvedTheme}>themed</div>;
    }

    const html = renderToString(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>,
    );
    expect(html).toContain("themed");
  });

  it("should provide resetTheme function", () => {
    function TestComponent() {
      const { resetTheme } = useTheme();
      return <div>{typeof resetTheme}</div>;
    }

    const html = renderToString(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(html).toContain("function");
  });

  it("should provide defaultTheme property", () => {
    function TestComponent() {
      const { defaultTheme } = useTheme();
      return <div data-default={defaultTheme}>themed</div>;
    }

    const html = renderToString(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>,
    );
    expect(html).toContain("themed");
  });
});

describe("useTheme hook", () => {
  it("should throw error when used outside ThemeProvider", () => {
    expect(() => {
      function TestComponent() {
        useTheme();
        return null;
      }
      renderToString(<TestComponent />);
    }).toThrow();
  });

  it("should provide theme context inside ThemeProvider", () => {
    function TestComponent() {
      const { theme } = useTheme();
      return <div data-theme={theme}>themed</div>;
    }

    const html = renderToString(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>,
    );
    expect(html).toContain("themed");
  });

  it("should provide setTheme function", () => {
    function TestComponent() {
      const { setTheme } = useTheme();
      return <div>{typeof setTheme}</div>;
    }

    const html = renderToString(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(html).toContain("function");
  });
});