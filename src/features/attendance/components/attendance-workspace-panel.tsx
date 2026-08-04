"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AttendanceWorkspacePanel({
  contextBar,
  toolbar,
  children,
  footer,
  className,
}: {
  contextBar?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 border-border/70 shadow-sm", className)}>
      <CardContent className="min-w-0 space-y-4 p-6">
        {contextBar}
        {toolbar}
        {children}
        {footer}
      </CardContent>
    </Card>
  );
}

export function AttendanceWorkspaceTableShell({
  isEmpty,
  emptyState,
  children,
}: {
  isEmpty: boolean;
  emptyState: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.25rem] border border-border/70">
      {isEmpty ? (
        <div className="p-6">{emptyState}</div>
      ) : (
        <div className="min-w-0 max-w-full overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

/** Grid class shared by attendance module filter bars. Room for future filter slots. */
export const ATTENDANCE_WORKSPACE_FILTER_GRID =
  "2xl:grid 2xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]";

/** Toolbar row when filters share a row with a primary action button. */
export function AttendanceWorkspaceFilterToolbar({
  filters,
  actions,
}: {
  filters: React.ReactNode;
  actions?: React.ReactNode;
}) {
  if (!actions) {
    return filters;
  }

  return (
    <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
      <div className="min-w-0 flex-1">{filters}</div>
      <div className="shrink-0">{actions}</div>
    </div>
  );
}
