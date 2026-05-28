/**
 * Unit tests for Breadcrumb components
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "~/components/ui/breadcrumb";

describe("Breadcrumb", () => {
  it("should render Breadcrumb as nav with aria-label", () => {
    const html = renderToString(<Breadcrumb />);
    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="breadcrumb"');
  });

  it("should render BreadcrumbList with ol element", () => {
    const html = renderToString(
      <Breadcrumb>
        <BreadcrumbList />
      </Breadcrumb>,
    );
    expect(html).toContain("<ol");
    expect(html).toContain("flex-wrap");
    expect(html).toContain("text-sm");
  });

  it("should render BreadcrumbItem with li element", () => {
    const html = renderToString(
      <BreadcrumbList>
        <BreadcrumbItem />
      </BreadcrumbList>,
    );
    expect(html).toContain("<li");
    expect(html).toContain("inline-flex");
  });

  it("should render BreadcrumbLink with a element", () => {
    const html = renderToString(<BreadcrumbLink href="/home">Home</BreadcrumbLink>);
    expect(html).toContain("<a");
    expect(html).toContain("/home");
    expect(html).toContain("Home");
    expect(html).toContain("hover:text-foreground");
  });

  it("should render BreadcrumbLink with asChild prop", () => {
    const html = renderToString(
      <BreadcrumbLink asChild>
        <span>Custom</span>
      </BreadcrumbLink>,
    );
    expect(html).toContain("<span");
    expect(html).toContain("Custom");
  });

  it("should render BreadcrumbPage with current page attributes", () => {
    const html = renderToString(<BreadcrumbPage>Current</BreadcrumbPage>);
    expect(html).toContain("<span");
    expect(html).toContain("Current");
    expect(html).toContain('aria-label="breadcrumb page"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("text-foreground");
    expect(html).toContain("font-normal");
  });

  it("should render BreadcrumbSeparator with ChevronRight icon", () => {
    const html = renderToString(<BreadcrumbSeparator />);
    expect(html).toContain("<li");
    expect(html).toContain('role="presentation"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("should render BreadcrumbSeparator with custom children", () => {
    const html = renderToString(<BreadcrumbSeparator>/</BreadcrumbSeparator>);
    expect(html).toContain("/");
  });

  it("should render BreadcrumbEllipsis with MoreHorizontal icon", () => {
    const html = renderToString(<BreadcrumbEllipsis />);
    expect(html).toContain("<span");
    expect(html).toContain('role="presentation"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("h-9");
    expect(html).toContain("w-9");
  });

  it("should render complete breadcrumb structure", () => {
    const html = renderToString(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>About</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(html).toContain("<nav");
    expect(html).toContain("Home");
    expect(html).toContain("About");
  });

  it("should apply custom className to components", () => {
    const html = renderToString(
      <BreadcrumbLink href="/test" className="custom-link">
        Test
      </BreadcrumbLink>,
    );
    expect(html).toContain("custom-link");
  });
});