"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableCard } from "@/components/shared/data-table-card";
import { MetricGrid } from "@/components/shared/metric-grid";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StaffLeaveDialog } from "@/features/attendance/components/staff-leave-dialog";
import { StaffLeaveRowActions } from "@/features/attendance/components/staff-leave-row-actions";
import type { ApprovedLeaveManagementData } from "@/features/attendance/types";
import {
  formatLeaveDateRange,
  formatStaffLeaveTypeLabel,
  formatStaffRoleLabel,
  getInclusiveDayCount,
} from "@/features/attendance/utils";
import { getBusinessNow } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export function ApprovedLeaveManagementSection({
  data,
}: {
  data: ApprovedLeaveManagementData;
}) {
  const searchParams = useSearchParams();
  const today = getBusinessNow().toFormat("yyyy-LL-dd");
  const leaveSearch = searchParams.get("leaveSearch")?.trim().toLowerCase() ?? "";
  const leaveType = searchParams.get("leaveType") ?? "";
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
  const activeTodayCount = data.leaveEntries.filter(
    (leaveEntry) => leaveEntry.startDate <= today && leaveEntry.endDate >= today,
  ).length;

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <MetricGrid className="xl:grid-cols-3">
        <StatCard
          title="Approved leave"
          value={String(data.leaveEntries.length)}
        />
        <StatCard
          title="Active today"
          value={String(activeTodayCount)}
          tone={activeTodayCount > 0 ? "info" : "neutral"}
          badge={activeTodayCount > 0 ? "in effect" : "none today"}
        />
        <StatCard
          title="Active staff"
          value={String(data.activeStaff.length)}
        />
      </MetricGrid>

      <DataTableCard
        className="min-w-0"
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <DataTableFilters
              key={`${leaveSearch}:${leaveType}`}
              className="w-full xl:flex-1 xl:grid xl:grid-cols-[minmax(0,1fr)_220px]"
              pageParamName="leavePage"
              search={{
                name: "leaveSearch",
                value: searchParams.get("leaveSearch") ?? "",
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
              ]}
            />
            <StaffLeaveDialog activeStaff={data.activeStaff} />
          </div>
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
        {leavePagination.totalItems === 0 ? (
          <EmptyState
            title="No approved leave entries"
            description="Record approved leave so attendance and payroll can treat covered dates correctly."
            action={<StaffLeaveDialog activeStaff={data.activeStaff} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
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
                        <p className="font-medium text-foreground">
                          {leaveEntry.staffName}
                        </p>
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
                        {leaveEntry.notes?.trim() ? leaveEntry.notes : "No notes"}
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
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
