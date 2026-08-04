import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BranchHolidayRowActions } from "@/features/attendance/components/branch-holiday-row-actions";
import type { BranchHolidaySummary } from "@/features/attendance/types";

vi.mock("@/features/attendance/actions/timekeeping-actions", () => ({
  deleteBranchHolidayAction: vi.fn(),
}));

vi.mock("@/components/shared/icon-action", () => ({
  IconActionButton: ({
    label,
    onClick,
  }: {
    label: string;
    onClick?: () => void;
  }) => (
    <button type="button" aria-label={label} onClick={onClick}>
      {label}
    </button>
  ),
  IconActionConfirm: ({ label }: { label: string }) => <button type="button">{label}</button>,
  IconActionGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/features/attendance/components/branch-holiday-dialog", () => ({
  BranchHolidayDialog: ({
    open,
    holiday,
  }: {
    open?: boolean;
    holiday?: BranchHolidaySummary | null;
  }) => <div data-testid="branch-holiday-dialog">{holiday?.label}:{open ? "open" : "closed"}</div>,
}));

const holiday: BranchHolidaySummary = {
  id: "holiday-1",
  branchId: "branch-1",
  holidayDate: "2026-01-01",
  label: "New Year's Day",
  holidayKind: "public_holiday",
  payTreatment: "paid_regular_day",
  notes: null,
};

describe("BranchHolidayRowActions", () => {
  it("opens the edit holiday dialog from the edit action", () => {
    render(<BranchHolidayRowActions holiday={holiday} />);

    expect(screen.getByTestId("branch-holiday-dialog")).toHaveTextContent("New Year's Day:closed");

    fireEvent.click(screen.getByRole("button", { name: "Edit New Year's Day" }));

    expect(screen.getByTestId("branch-holiday-dialog")).toHaveTextContent("New Year's Day:open");
  });
});
