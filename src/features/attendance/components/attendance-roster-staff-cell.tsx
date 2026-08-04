"use client";

import { buildStaffInitials } from "@/features/attendance/utils";
import { cn } from "@/lib/utils";

export function AttendanceRosterStaffCell({ fullName }: { fullName: string }) {
  const initials = buildStaffInitials(fullName);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          "bg-brand-navy/8 text-xs font-semibold text-brand-navy",
        )}
      >
        {initials || "?"}
      </span>
      <p className="truncate font-medium text-foreground">{fullName}</p>
    </div>
  );
}
