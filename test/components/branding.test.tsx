/**
 * Unit tests for src/components/branding.tsx
 * Tests: Branding, BrandTitle, BrandDescription, BrandLogo rendering
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import {
  Branding,
  BrandTitle,
  BrandDescription,
  BrandLogo,
} from "../../src/components/layout/landing/branding";

describe("Branding", () => {
  it("should render without crashing", () => {
    const html = renderToString(<Branding />);
    expect(html).toContain("bg-gradient-to-br");
  });

  it("should render with custom className", () => {
    const html = renderToString(<Branding className="custom-class" />);
    expect(html).toContain("custom-class");
  });

  it("should render with center alignment", () => {
    const html = renderToString(<Branding align="center" />);
    expect(html).toContain("items-center");
  });

  it("should render with center justify", () => {
    const html = renderToString(<Branding justify="center" />);
    expect(html).toContain("justify-center");
  });

  it("should hide on mobile when hidden.mobile is true", () => {
    const html = renderToString(<Branding hidden={{ mobile: true }} />);
    expect(html).toContain("hidden lg:flex");
  });

  it("should show default content when showDefaultContent is true", () => {
    const html = renderToString(<Branding showDefaultContent={true} />);
    expect(html).toContain("Build faster");
  });

  it("should hide default content when showDefaultContent is false", () => {
    const html = renderToString(<Branding showDefaultContent={false} />);
    expect(html).not.toContain("Start building");
  });
});

describe("BrandTitle", () => {
  it("should render default title", () => {
    const html = renderToString(<BrandTitle />);
    expect(html).toContain("Build faster");
  });

  it("should render custom size", () => {
    const html = renderToString(<BrandTitle size="5xl" />);
    expect(html).toContain("text-5xl");
  });

  it("should render custom children", () => {
    const html = renderToString(<BrandTitle>Custom Title</BrandTitle>);
    expect(html).toContain("Custom Title");
  });
});

describe("BrandDescription", () => {
  it("should render default description", () => {
    const html = renderToString(<BrandDescription />);
    expect(html).toContain("full-stack");
    expect(html).toContain("confidence");
  });

  it("should render custom size", () => {
    const html = renderToString(<BrandDescription size="lg" />);
    expect(html).toContain("text-lg");
  });

  it("should render custom maxWidth", () => {
    const html = renderToString(<BrandDescription maxWidth="xl" />);
    expect(html).toContain("max-w-xl");
  });

  it("should render custom children", () => {
    const html = renderToString(<BrandDescription>Custom Description</BrandDescription>);
    expect(html).toContain("Custom Description");
  });
});

describe("BrandLogo", () => {
  it("should render without crashing", () => {
    const html = renderToString(<BrandLogo />);
    expect(html).toContain("svg");
  });

  it("should render with name when showName is true", () => {
    const html = renderToString(<BrandLogo showName={true} />);
    expect(html).toContain("TSSE");
  });

  it("should hide name when showName is false", () => {
    const html = renderToString(<BrandLogo showName={false} />);
    expect(html).not.toContain("TSSE");
  });

  it("should render different sizes", () => {
    const smallHtml = renderToString(<BrandLogo size="sm" />);
    expect(smallHtml).toContain("w-8");

    const largeHtml = renderToString(<BrandLogo size="lg" />);
    expect(largeHtml).toContain("w-12");
  });
});