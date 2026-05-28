/**
 * Unit tests for Table components
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Table } from "~/components/ui/table";

describe("Table", () => {
  it("should render Table with proper wrapper", () => {
    const html = renderToString(<Table />);
    expect(html).toContain("relative");
    expect(html).toContain("w-full");
    expect(html).toContain("overflow-auto");
    expect(html).toContain("<table");
  });

  it("should render Table with custom className", () => {
    const html = renderToString(<Table className="custom-table" />);
    expect(html).toContain("custom-table");
  });

  it("should render table with caption-bottom text-sm", () => {
    const html = renderToString(<Table />);
    expect(html).toContain("caption-bottom");
    expect(html).toContain("text-sm");
  });
});