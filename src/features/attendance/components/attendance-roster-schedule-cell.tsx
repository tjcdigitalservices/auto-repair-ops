"use client";

import { StaffScheduleDialog } from "@/features/attendance/components/staff-schedule-dialog";
import type { StaffScheduleSummary } from "@/features/attendance/types";
import { formatRosterScheduleLabel } from "@/features/attendance/utils";
import { cn } from "@/lib/utils";

export function AttendanceRosterScheduleCell({
  staffId,
  staffName,
  schedule,
}: {
  staffId: string;
  staffName: string;
  schedule: StaffScheduleSummary | null;
}) {
  const scheduleLabel = formatRosterScheduleLabel(schedule);

  return (
    <StaffScheduleDialog
      staffId={staffId}
      staffName={staffName}
      schedule={schedule}
      trigger={({ openDialog }) => (
        <button
          type="button"
          onClick={openDialog}
          className={cn(
            "text-left text-sm transition-colors",
            scheduleLabel
              ? "font-medium text-foreground hover:text-brand-navy"
              : "font-medium text-brand-navy hover:underline",
          )}
        >
          {scheduleLabel ?? "Assign Shift"}
        </button>
      )}
    />
  );
}
