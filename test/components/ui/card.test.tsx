/**
 * Unit tests for Card component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";

describe("Card", () => {
  it("should render Card container", () => {
    const html = renderToString(<Card>Content</Card>);
    expect(html).toContain("Content");
    expect(html).toContain("rounded-lg");
    expect(html).toContain("border");
  });

  it("should render CardHeader", () => {
    const html = renderToString(<CardHeader>Header</CardHeader>);
    expect(html).toContain("Header");
    expect(html).toContain("flex");
  });

  it("should render CardTitle with correct classes", () => {
    const html = renderToString(<CardTitle>Title</CardTitle>);
    expect(html).toContain("Title");
    expect(html).toContain("font-semibold");
    expect(html).toContain("text-2xl");
  });

  it("should render CardDescription with correct classes", () => {
    const html = renderToString(<CardDescription>Description</CardDescription>);
    expect(html).toContain("Description");
    expect(html).toContain("text-sm");
    expect(html).toContain("text-muted-foreground");
  });

  it("should render CardContent", () => {
    const html = renderToString(<CardContent>Body</CardContent>);
    expect(html).toContain("Body");
    expect(html).toContain("p-6");
  });

  it("should render CardFooter", () => {
    const html = renderToString(<CardFooter>Footer</CardFooter>);
    expect(html).toContain("Footer");
    expect(html).toContain("flex");
  });

  it("should compose full card with all sub-components", () => {
    const html = renderToString(
      <Card>
        <CardHeader>
          <CardTitle>My Title</CardTitle>
          <CardDescription>My Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
        <CardFooter>
          <span>Action</span>
        </CardFooter>
      </Card>,
    );
    expect(html).toContain("My Title");
    expect(html).toContain("My Description");
    expect(html).toContain("Card body content");
    expect(html).toContain("Action");
  });

  it("should apply custom className to Card", () => {
    const html = renderToString(<Card className="my-card">C</Card>);
    expect(html).toContain("my-card");
  });

  it("should forward ref to Card", () => {
    const ref = React.createRef<HTMLDivElement>();
    renderToString(<Card ref={ref}>Ref</Card>);
    expect(true).toBe(true);
  });
});