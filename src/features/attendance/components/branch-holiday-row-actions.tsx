"use client";

import { useState } from "react";
import { Pencil, StickyNote, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionButton, IconActionConfirm, IconActionGroup } from "@/components/shared/icon-action";
import { deleteBranchHolidayAction } from "@/features/attendance/actions/timekeeping-actions";
import { deleteSandboxBranchHolidayAction } from "@/features/sandbox/form-actions";
import { useBoundFormAction } from "@/features/sandbox/use-bound-action";
import { BranchHolidayDialog } from "@/features/attendance/components/branch-holiday-dialog";
import type { BranchHolidaySummary } from "@/features/attendance/types";

export function BranchHolidayRowActions({
  holiday,
}: {
  holiday: BranchHolidaySummary;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const trimmedNotes = holiday.notes?.trim();
  const deleteAction = useBoundFormAction(deleteBranchHolidayAction, deleteSandboxBranchHolidayAction);

  return (
    <>
      <IconActionGroup>
        {trimmedNotes ? (
          <IconActionButton label={trimmedNotes} icon={StickyNote} className="text-muted-foreground" />
        ) : null}
        <IconActionButton
          label={`Edit ${holiday.label}`}
          icon={Pencil}
          onClick={() => setIsEditOpen(true)}
        />
        <IconActionConfirm
          label={`Delete ${holiday.label}`}
          icon={Trash2}
          title={`Delete ${holiday.label}?`}
          description="This calendar date will stop excluding attendance from payroll readiness once removed."
          confirmLabel="Delete calendar date"
          cancelLabel="Keep calendar date"
          action={deleteAction}
          fields={[{ name: "holidayId", value: holiday.id }]}
        />
      </IconActionGroup>
      <BranchHolidayDialog
        holiday={holiday}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        showTrigger={false}
      />
    </>
  );
}
