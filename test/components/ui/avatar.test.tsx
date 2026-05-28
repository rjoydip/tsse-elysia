/**
 * Unit tests for Avatar component
 */

import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { Avatar } from "~/components/ui/avatar";

describe("Avatar", () => {
  it("should render Avatar component", () => {
    const html = renderToString(<Avatar />);
    expect(html).toContain("rounded-full");
    expect(html).toContain("h-10");
    expect(html).toContain("w-10");
  });

  it("should render Avatar with custom className", () => {
    const html = renderToString(<Avatar className="custom-avatar" />);
    expect(html).toContain("custom-avatar");
  });
});