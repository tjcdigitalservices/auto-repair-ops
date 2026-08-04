"use client";

import { CalendarClock, StickyNote } from "lucide-react";

import { IconActionButton, IconActionGroup } from "@/components/shared/icon-action";
import { StaffScheduleDialog } from "@/features/attendance/components/staff-schedule-dialog";
import type { StaffScheduleSummary } from "@/features/attendance/types";

export function AttendanceRosterRowActions({
  schedule,
  staffId,
  staffName,
  notes,
}: {
  schedule: StaffScheduleSummary | null;
  staffId: string;
  staffName: string;
  notes?: string | null;
}) {
  const trimmedNotes = notes?.trim();

  return (
    <IconActionGroup>
      {trimmedNotes ? (
        <IconActionButton
          label={trimmedNotes}
          icon={StickyNote}
          className="text-muted-foreground"
        />
      ) : null}
      <StaffScheduleDialog
        staffId={staffId}
        staffName={staffName}
        schedule={schedule}
        trigger={({ openDialog }) => (
          <IconActionButton
            label={`Edit schedule for ${staffName}`}
            icon={CalendarClock}
            onClick={openDialog}
          />
        )}
      />
    </IconActionGroup>
  );
}
