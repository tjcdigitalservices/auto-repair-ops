"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ATTENDANCE_WORKSPACE_FILTER_GRID,
  AttendanceWorkspaceFilterToolbar,
  AttendanceWorkspacePanel,
  AttendanceWorkspaceTableShell,
} from "@/features/attendance/components/attendance-workspace-panel";
import { StaffLeaveDialog } from "@/features/attendance/components/staff-leave-dialog";
import { StaffLeaveRowActions } from "@/features/attendance/components/staff-leave-row-actions";
import type { ApprovedLeaveManagementData } from "@/features/attendance/types";
import {
  formatLeaveDateRange,
  formatStaffLeaveTypeLabel,
  formatStaffRoleLabel,
  getInclusiveDayCount,
} from "@/features/attendance/utils";
import { paginateItems } from "@/lib/pagination";

export function ApprovedLeaveManagementSection({
  data,
}: {
  data: ApprovedLeaveManagementData;
}) {
  const searchParams = useSearchParams();
  const leaveSearchValue = searchParams.get("leaveSearch")?.trim() ?? "";
  const leaveSearch = leaveSearchValue.toLowerCase();
  const leaveType = searchParams.get("leaveType") ?? "";
  const hasFilters = Boolean(leaveSearchValue || leaveType);
  const filteredLeaveEntries = useMemo(
    () =>
      data.leaveEntries.filter((leaveEntry) => {
        if (leaveType && leaveEntry.leaveType !== leaveType) {
          return false;
        }

        if (!leaveSearch) {
          return true;
        }

        return [
          leaveEntry.staffName,
          leaveEntry.staffRole ? formatStaffRoleLabel(leaveEntry.staffRole) : "",
          formatStaffLeaveTypeLabel(leaveEntry.leaveType),
          leaveEntry.notes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(leaveSearch);
      }),
    [data.leaveEntries, leaveSearch, leaveType],
  );
  const leavePagination = paginateItems(
    filteredLeaveEntries,
    searchParams.get("leavePage") ?? undefined,
  );
  const emptyState = getLeaveEmptyState(hasFilters);

  return (
    <AttendanceWorkspacePanel
      toolbar={
        <AttendanceWorkspaceFilterToolbar
          filters={
            <DataTableFilters
              key={`${leaveSearchValue}:${leaveType}`}
              className={ATTENDANCE_WORKSPACE_FILTER_GRID}
              pageParamName="leavePage"
              search={{
                name: "leaveSearch",
                value: leaveSearchValue,
                placeholder: "Search staff, leave type, or notes",
              }}
              filters={[
                {
                  type: "select",
                  name: "leaveType",
                  value: leaveType,
                  options: [
                    { value: "", label: "All leave types" },
                    { value: "vacation", label: "Vacation" },
                    { value: "sick", label: "Sick" },
                    { value: "emergency", label: "Emergency" },
                    { value: "unpaid", label: "Unpaid" },
                    { value: "other", label: "Other" },
                  ],
                },
                // Future filters: status, date range, branch
              ]}
            />
          }
          actions={<StaffLeaveDialog activeStaff={data.activeStaff} />}
        />
      }
      footer={
        <DataTablePagination
          page={leavePagination.page}
          pageSize={leavePagination.pageSize}
          totalItems={leavePagination.totalItems}
          totalPages={leavePagination.totalPages}
          startItem={leavePagination.startItem}
          endItem={leavePagination.endItem}
          pageParamName="leavePage"
        />
      }
    >
      <AttendanceWorkspaceTableShell
        isEmpty={leavePagination.totalItems === 0}
        emptyState={
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
          />
        }
      >
        <Table className="min-w-[860px] xl:min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead>Staff member</TableHead>
              <TableHead>Leave type</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leavePagination.items.map((leaveEntry) => (
              <TableRow key={leaveEntry.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{leaveEntry.staffName}</p>
                    <p className="text-sm text-muted-foreground">
                      {leaveEntry.staffRole
                        ? formatStaffRoleLabel(leaveEntry.staffRole)
                        : "Unknown role"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge tone="warning">
                    {formatStaffLeaveTypeLabel(leaveEntry.leaveType)}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatLeaveDateRange(leaveEntry)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getInclusiveDayCount(leaveEntry.startDate, leaveEntry.endDate)}
                </TableCell>
                <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                  <span className="line-clamp-2">
                    {leaveEntry.notes?.trim() ? leaveEntry.notes : "—"}
                  </span>
                </TableCell>
                <TableCell className="w-14 text-right">
                  <StaffLeaveRowActions
                    leaveEntry={leaveEntry}
                    activeStaff={data.activeStaff}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AttendanceWorkspaceTableShell>
    </AttendanceWorkspacePanel>
  );
}

function getLeaveEmptyState(hasFilters: boolean) {
  if (hasFilters) {
    return {
      title: "No approved leave records match your filters",
      description: "Try a different search term or leave type filter.",
    };
  }

  return {
    title: "No approved leave records",
    description: "Approved leave entries will appear here once employees have approved leave.",
  };
}
