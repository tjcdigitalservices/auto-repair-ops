"use client";

import type { AttendanceFilterStatus, AttendanceDailySummary } from "@/features/attendance/types";
import { cn } from "@/lib/utils";

type SummaryItem = {
  label: string;
  value: number;
  filter: AttendanceFilterStatus;
};

export function AttendanceDaySummaryBar({
  summary,
  activeFilter,
  onFilterChange,
  isBranchHolidayDate,
}: {
  summary: AttendanceDailySummary;
  activeFilter: AttendanceFilterStatus | "";
  onFilterChange: (filter: AttendanceFilterStatus) => void;
  isBranchHolidayDate: boolean;
}) {
  const items: SummaryItem[] = [
    { label: "Present", value: summary.presentCount, filter: "present" },
    { label: "Late", value: summary.lateCount, filter: "late" },
    {
      label: "Absent",
      value: summary.absentCount + summary.unrecordedCount,
      filter: "absent_unrecorded",
    },
    {
      label: "Missing punch",
      value: isBranchHolidayDate ? 0 : summary.missingTimeoutCount,
      filter: "missing_timeout",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = activeFilter === item.filter;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onFilterChange(item.filter)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                : "border-border/70 text-foreground hover:bg-muted/30",
            )}
            aria-pressed={isActive}
          >
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </button>
        );
      })}
    </div>
  );
}
