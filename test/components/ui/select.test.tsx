/**
 * Unit tests for Select components
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Select, SelectTrigger, SelectValue } from "~/components/ui/select";

describe("Select", () => {
  it("should render Select with trigger", () => {
    const html = renderToString(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>,
    );
    expect(html).toContain("Select an option");
    expect(html).toContain("flex");
    expect(html).toContain("h-10");
    expect(html).toContain("rounded-md");
  });

  it("should render SelectTrigger with proper styles", () => {
    const html = renderToString(
      <Select>
        <SelectTrigger>Choose</SelectTrigger>
      </Select>,
    );
    expect(html).toContain("Choose");
    expect(html).toContain("flex");
    expect(html).toContain("h-10");
  });

  it("should render SelectValue with placeholder", () => {
    const html = renderToString(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>,
    );
    expect(html).toContain("Pick one");
    expect(html).toContain("data-placeholder");
  });

  it("should apply custom className to SelectTrigger", () => {
    const html = renderToString(
      <Select>
        <SelectTrigger className="custom-trigger">Trigger</SelectTrigger>
      </Select>,
    );
    expect(html).toContain("custom-trigger");
  });

  it("should render SelectTrigger with role combobox", () => {
    const html = renderToString(
      <Select>
        <SelectTrigger>Open</SelectTrigger>
      </Select>,
    );
    expect(html).toContain('role="combobox"');
  });

  it("should render SelectTrigger with data-state", () => {
    const html = renderToString(
      <Select>
        <SelectTrigger>Trigger</SelectTrigger>
      </Select>,
    );
    expect(html).toContain("data-state");
  });
});