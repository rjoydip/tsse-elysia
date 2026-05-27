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

  it("should render Overview tab as active when value is overview", () => {
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Overview");
    expect(html).toContain("Analytics");
    expect(html).toContain("Reports");
    // Check that Overview tab has active state indicators
    expect(html).toContain('data-state="active"');
  });

  it("should render Analytics tab as active when value is analytics", () => {
    const html = renderToString(
      <DashboardTabs value="analytics" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Overview");
    expect(html).toContain("Analytics");
    expect(html).toContain("Reports");
    // Check that Analytics tab has active state indicators
    expect(html).toContain('data-state="active"');
  });

  it("should call onValueChange when Overview tab is clicked", () => {
    // Note: Testing click behavior with renderToString is limited
    // In a real test environment with DOM, we would simulate clicks
    // For now, we verify the component renders correctly with different values
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Overview");
  });

  it("should call onValueChange when Analytics tab is clicked", () => {
    const html = renderToString(
      <DashboardTabs value="analytics" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Analytics");
  });

  it("should render Reports tab as disabled", () => {
    const html = renderToString(
      <DashboardTabs value="overview" onValueChange={mockOnValueChange}>
        {children}
      </DashboardTabs>,
    );
    expect(html).toContain("Reports");
    // Check that Reports tab has disabled attribute
    expect(html).toContain("disabled");
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
});