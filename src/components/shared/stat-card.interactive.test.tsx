import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  InteractiveStatCardLink,
  StatCard,
  interactiveStatCardClassName,
  interactiveStatCardFocusClassName,
} from "@/components/shared/stat-card";
import { OperationalAlerts } from "@/features/reports/components/operational-alerts";
import { ReportsKpiCard } from "@/features/reports/components/reports-kpi-card";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("interactive stat card hover consistency", () => {
  it("exports one shared hover + focus treatment", () => {
    expect(interactiveStatCardClassName).toContain("cursor-pointer");
    expect(interactiveStatCardClassName).toContain("hover:shadow-md");
    expect(interactiveStatCardClassName).toContain("hover:border-brand-navy/30");
    expect(interactiveStatCardFocusClassName).toContain("focus-visible:ring-brand-navy/30");
  });

  it("applies the shared hover class on clickable StatCards only", () => {
    const { container, rerender } = render(
      <StatCard title="Customers" value="12" href="/customers" />,
    );

    expect(container.querySelector(".surface-card")?.className).toContain(
      interactiveStatCardClassName,
    );
    expect(screen.getByRole("link")).toHaveClass(interactiveStatCardFocusClassName);

    rerender(<StatCard title="Customers" value="12" />);
    expect(container.querySelector(".surface-card")?.className).not.toContain("cursor-pointer");
    expect(container.querySelector(".surface-card")?.className).not.toContain("hover:shadow-md");
  });

  it("uses the same shared wrappers on Reports KPI and alert cards", () => {
    const { container: kpiContainer } = render(
      <ReportsKpiCard
        metric={{ label: "Revenue", value: 100, kind: "currency", helper: "Period total" }}
        href="/reports#reports-revenue-trend"
      />,
    );
    expect(kpiContainer.querySelector(".surface-card")?.className).toContain(
      interactiveStatCardClassName,
    );
    expect(kpiContainer.querySelector("a")?.className).toContain(interactiveStatCardFocusClassName);

    const { container: alertContainer } = render(
      <OperationalAlerts
        metrics={[{ label: "Open POS", value: 2, kind: "quantity" }]}
        hrefByLabel={{ "Open POS": "/pos" }}
      />,
    );
    expect(alertContainer.querySelector(".surface-card")?.className).toContain(
      interactiveStatCardClassName,
    );
    expect(alertContainer.querySelector("a")?.className).toContain(interactiveStatCardFocusClassName);
  });

  it("keeps non-clickable report cards without the interactive hover class", () => {
    const { container } = render(
      <ReportsKpiCard
        metric={{ label: "Static", value: 1, kind: "quantity" }}
      />,
    );

    expect(container.querySelector(".surface-card")?.className).not.toContain("cursor-pointer");
    expect(container.querySelector(".surface-card")?.className).not.toContain("hover:shadow-md");
  });

  it("InteractiveStatCardLink always carries the shared focus class", () => {
    render(
      <InteractiveStatCardLink href="/customers">
        <span>Child</span>
      </InteractiveStatCardLink>,
    );

    expect(screen.getByRole("link")).toHaveClass(interactiveStatCardFocusClassName);
  });
});
