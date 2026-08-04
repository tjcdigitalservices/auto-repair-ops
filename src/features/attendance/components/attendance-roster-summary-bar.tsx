"use client";

import type { AttendanceDailySummary, RosterFilterStatus } from "@/features/attendance/types";
import { cn } from "@/lib/utils";

type SummaryItem = {
  label: string;
  value: number;
  filter: RosterFilterStatus | "";
};

export function AttendanceRosterSummaryBar({
  summary,
  activeFilter,
  onFilterChange,
}: {
  summary: AttendanceDailySummary;
  activeFilter: RosterFilterStatus | "";
  onFilterChange: (filter: RosterFilterStatus | "") => void;
}) {
  const needsScheduleCount = summary.totalStaff - summary.scheduleConfiguredCount;
  const items: SummaryItem[] = [
    { label: "Staff", value: summary.totalStaff, filter: "" },
    { label: "Scheduled", value: summary.scheduleConfiguredCount, filter: "scheduled" },
    { label: "Need Schedule", value: needsScheduleCount, filter: "needs_schedule" },
    { label: "Leave", value: summary.leaveCount, filter: "leave" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = activeFilter === item.filter;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onFilterChange(isActive && item.filter ? "" : item.filter)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                : "border-border/70 text-foreground hover:bg-muted/30",
            )}
            aria-pressed={isActive}
          >
            <span className="font-semibold tabular-nums">{item.value}</span>
            <span className="text-muted-foreground">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
