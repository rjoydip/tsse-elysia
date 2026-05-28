/**
 * Unit tests for Tabs component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";

describe("Tabs", () => {
  it("should render Tabs root component with children", () => {
    const html = renderToString(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>,
    );
    expect(html).toContain("Tab 1");
    expect(html).toContain("Content 1");
  });

  it("should render TabsList within Tabs with correct classes", () => {
    const html = renderToString(
      <Tabs defaultValue="tab">
        <TabsList>
          <TabsTrigger value="tab">Tab</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(html).toContain("inline-flex");
    expect(html).toContain("h-10");
    expect(html).toContain("bg-muted");
  });

  it("should render TabsTrigger within Tabs with correct classes", () => {
    const html = renderToString(
      <Tabs defaultValue="tab">
        <TabsList>
          <TabsTrigger value="tab">Tab</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(html).toContain("Tab");
    expect(html).toContain("inline-flex");
  });

  it("should render TabsContent within Tabs with correct classes", () => {
    const html = renderToString(
      <Tabs defaultValue="tab">
        <TabsContent value="tab">Content</TabsContent>
      </Tabs>,
    );
    expect(html).toContain("Content");
    expect(html).toContain("mt-2");
  });

  it("should render TabsList with custom className", () => {
    const html = renderToString(
      <Tabs defaultValue="tab">
        <TabsList className="my-tabs">
          <TabsTrigger value="tab">Tab</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(html).toContain("my-tabs");
  });
});