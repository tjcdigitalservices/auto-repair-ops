import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PageMetric, PageMetrics } from "@/components/shared/page-metrics";

describe("PageMetrics", () => {
  it("renders metrics with consistent badge values", () => {
    render(
      <PageMetrics aria-label="Inventory summary">
        <PageMetric label="Tracked" value={326} variant="secondary" active />
        <PageMetric label="Stock Value" value="₱1.2M" variant="outline" />
      </PageMetrics>,
    );

    expect(screen.getByLabelText("Inventory summary")).toBeInTheDocument();
    expect(screen.getByText("326")).toBeInTheDocument();
    expect(screen.getByText("₱1.2M")).toBeInTheDocument();
  });

  it("marks interactive metrics as pressed when active", () => {
    render(
      <PageMetric
        label="Low Stock"
        value={23}
        variant="warning"
        active
        onClick={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /low stock/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onClick for filter metrics", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <PageMetric
        label="Out of Stock"
        value={12}
        variant="destructive"
        onClick={onClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: /out of stock/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
