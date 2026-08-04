import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RevenueTrendChart,
  buildAxisTicks,
  computeAxisMax,
  formatAxisCurrency,
  scaleToAxis,
} from "@/features/reports/components/revenue-trend-chart";

describe("RevenueTrendChart helpers", () => {
  it("computes separate axis maxima for currency and count scales", () => {
    expect(computeAxisMax(1_700_000)).toBe(2_000_000);
    expect(computeAxisMax(4, { integer: true })).toBe(5);
  });

  it("formats compact currency ticks for large values", () => {
    expect(formatAxisCurrency(1_500_000)).toBe("₱1.5M");
    expect(formatAxisCurrency(250_000)).toBe("₱250K");
  });

  it("maps values onto independent axis ranges", () => {
    const chartHeight = 200;
    const currencyY = scaleToAxis(1_700_000, 2_000_000, chartHeight);
    const countY = scaleToAxis(4, 5, chartHeight);

    expect(currencyY).toBeLessThan(countY);
  });

  it("builds integer ticks for the vehicles released axis", () => {
    expect(buildAxisTicks(1, 5, { integer: true })).toEqual([0, 1]);
    expect(buildAxisTicks(5, 5, { integer: true })).toEqual([0, 1, 3, 4, 5]);
  });
});

describe("RevenueTrendChart", () => {
  it("renders dual-axis labels for quotation value and vehicles released", () => {
    const { container } = render(
      <RevenueTrendChart
        groupBy="monthly"
        data={[
          {
            key: "2026-07",
            label: "Jul",
            approvedQuotationValue: 1_700_000,
            vehiclesReleased: 3,
          },
          {
            key: "2026-08",
            label: "Aug",
            approvedQuotationValue: 950_000,
            vehiclesReleased: 1,
          },
        ]}
      />,
    );

    expect(screen.getByText("Quotation and service trend")).toBeInTheDocument();
    expect(screen.getByText("Vehicles released")).toBeInTheDocument();
    expect(screen.getByText("Approved quotation value")).toBeInTheDocument();
    expect(screen.getByText("₱2M")).toBeInTheDocument();

    const rightAxisLabels = container.querySelectorAll('[text-anchor="start"]');
    expect(Array.from(rightAxisLabels).map((node) => node.textContent)).toEqual([
      "0",
      "1",
      "3",
      "4",
      "5",
    ]);
  });

  it("renders invoice trend copy when requested", () => {
    render(
      <RevenueTrendChart
        variant="invoice"
        groupBy="monthly"
        data={[
          {
            key: "2026-07",
            label: "Jul",
            approvedQuotationValue: 1_700_000,
            vehiclesReleased: 3,
          },
        ]}
      />,
    );

    expect(screen.getByText("Invoice trend")).toBeInTheDocument();
    expect(screen.getByText("Invoice value")).toBeInTheDocument();
    expect(screen.getByText("Total invoice value")).toBeInTheDocument();
  });
});
