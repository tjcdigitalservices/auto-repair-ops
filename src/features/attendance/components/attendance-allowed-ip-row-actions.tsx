"use client";

import { Trash2 } from "lucide-react";

import { IconActionConfirm } from "@/components/shared/icon-action";
import { deleteAttendanceAllowedIpAction } from "@/features/attendance/actions/timekeeping-actions";
import { deleteSandboxAllowedIpAction } from "@/features/sandbox/form-actions";
import { useBoundFormAction } from "@/features/sandbox/use-bound-action";
import type { AttendanceAllowedIpSummary } from "@/features/attendance/types";

export function AttendanceAllowedIpRowActions({
  allowedIp,
}: {
  allowedIp: AttendanceAllowedIpSummary;
}) {
  const label = allowedIp.label?.trim() || allowedIp.ipAddress;
  const deleteAction = useBoundFormAction(deleteAttendanceAllowedIpAction, deleteSandboxAllowedIpAction);

  return (
    <IconActionConfirm
      label={`Remove ${label}`}
      icon={Trash2}
      title={`Remove ${label}?`}
      description="Mechanics will no longer be able to validate on-site attendance from this IP address."
      confirmLabel="Remove IP"
      cancelLabel="Keep IP"
      action={deleteAction}
      fields={[{ name: "allowedIpId", value: allowedIp.id }]}
      tone="destructive"
    />
  );
}
