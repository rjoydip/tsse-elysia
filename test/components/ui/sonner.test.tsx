/**
 * Unit tests for sonner/Toaster component
 * Tests: Toaster rendering and theme support
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/context/theme-provider";

describe("Toaster (sonner)", () => {
  it("should render without crashing", () => {
    const html = renderToString(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    );
    expect(html).toContain('aria-label="Notifications');
  });

  it("should render with custom className", () => {
    const html = renderToString(
      <ThemeProvider>
        <Toaster className="custom-toaster" />
      </ThemeProvider>,
    );
    expect(html).toContain('aria-label="Notifications');
  });

  it("should render within ThemeProvider", () => {
    const html = renderToString(
      <ThemeProvider defaultTheme="dark">
        <Toaster />
      </ThemeProvider>,
    );
    expect(html).toContain('aria-label="Notifications');
  });

  it("should accept theme prop", () => {
    const html = renderToString(
      <ThemeProvider defaultTheme="light">
        <Toaster theme="light" />
      </ThemeProvider>,
    );
    expect(html).toContain('aria-label="Notifications');
  });

  it("should accept rich theme prop", () => {
    const html = renderToString(
      <ThemeProvider defaultTheme="dark">
        <Toaster theme="dark" />
      </ThemeProvider>,
    );
    expect(html).toContain('aria-label="Notifications');
  });
});

/**
 * Integration tests for sonner toast functionality
 * These test the toast API usage patterns
 */

import { toast } from "sonner";

describe("sonner toast API", () => {
  it("should expose error toast function", () => {
    expect(typeof toast.error).toBe("function");
  });

  it("should expose success toast function", () => {
    expect(typeof toast.success).toBe("function");
  });

  it("should expose info toast function", () => {
    expect(typeof toast.info).toBe("function");
  });

  it("should expose warning toast function", () => {
    expect(typeof toast.warning).toBe("function");
  });

  it("should expose loading toast function", () => {
    expect(typeof toast.loading).toBe("function");
  });

  it("should accept message string", () => {
    const promise = toast.promise(Promise.resolve("test"), {
      loading: "Loading...",
      success: "Done!",
      error: "Failed",
    });
    expect(promise).toBeDefined();
  });
});