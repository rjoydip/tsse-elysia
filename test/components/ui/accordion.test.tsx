/**
 * Unit tests for Accordion component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "~/components/ui/accordion";

describe("Accordion", () => {
  it("should render Accordion with all components", () => {
    const html = renderToString(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(html).toContain("Trigger");
    expect(html).toContain("data-state");
  });

  it("should render AccordionItem with border", () => {
    const html = renderToString(
      <Accordion type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
        </AccordionItem>
      </Accordion>,
    );
    expect(html).toContain("border-b");
  });

  it("should render AccordionTrigger within Accordion", () => {
    const html = renderToString(
      <Accordion type="single">
        <AccordionItem value="item">
          <AccordionTrigger>Trigger</AccordionTrigger>
        </AccordionItem>
      </Accordion>,
    );
    expect(html).toContain("Trigger");
    expect(html).toContain("flex-1");
  });

  it("should render AccordionContent within Accordion", () => {
    const html = renderToString(
      <Accordion type="single">
        <AccordionItem value="item">
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("text-sm");
  });

  it("should render AccordionItem with custom className", () => {
    const html = renderToString(
      <Accordion type="single">
        <AccordionItem value="item" className="my-accordion">
          <AccordionTrigger>Trigger</AccordionTrigger>
        </AccordionItem>
      </Accordion>,
    );
    expect(html).toContain("my-accordion");
  });
});