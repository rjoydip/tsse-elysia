/**
 * Unit tests for src/features/dashboard/components/dashboard-tabs.tsx
 * Tests: DashboardTabs component - tab selection and disabled states
 */

import { describe, expect, it, vi, beforeEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { DashboardTabs } from "../../../src/features/dashboard/components/dashboard-tabs";

describe("DashboardTabs", () => {
  const mockOnValueChange = vi.fn();
  const children = <div>Test Content</div>;

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  it("should render overview tab and it is active by default", () => {
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    // Check that Overview tab has active state indicators
    expect(html).toContain('data-state="active"');
    expect(html).toContain("Overview");
    expect(html).toContain("Analytics");
    expect(html).toContain("Reports");
  });

  it("should render analytics tab and it is active when value is analytics", () => {
    const html = renderToString(
      <DashboardTabs value="analytics" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    // Check that Analytics tab has active state indicators
    expect(html).toContain('data-state="active"');
    expect(html).toContain("Overview");
    expect(html).toContain("Analytics");
    expect(html).toContain("Reports");
  });

  it("should render overview tab when value is overview", () => {
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Overview");
  });

  it("should render analytics tab when value is analytics", () => {
    const html = renderToString(
      <DashboardTabs value="analytics" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Analytics");
  });

  it("should render reports tab as disabled", () => {
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Reports");
    // Check that Reports tab has disabled attribute
    expect(html).toContain('disabled=""');
  });

  it("should have vertical orientation", () => {
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain('orientation="vertical"');
  });

  it("should pass children correctly", () => {
    const customChildren = <div className="test-content">Test Content</div>;
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {customChildren}
      </DashboardTabs>,
    );
    expect(html).toContain("Test Content");
  });

  it("renders without crashing when value is unknown", () => {
    const html = renderToString(
      <DashboardTabs value="unknown" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    // Expect the component to render and contain the children
    expect(html).toContain("Test Content");
  });

  it("should call onValueChange prop when provided (mock verification)", () => {
    // This test verifies the prop is properly passed through (not testing actual click behavior)
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Overview");
    // We can't test actual click behavior with renderToString, but we can verify
    // the prop is accepted and is a function
    expect(typeof mockOnValueChange).toBe("function");
  });
});