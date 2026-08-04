"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions } from "@/components/shared/page-header-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceDeviceRowActions } from "@/features/attendance/components/attendance-device-row-actions";
import {
  ATTENDANCE_WORKSPACE_FILTER_GRID,
  AttendanceWorkspacePanel,
  AttendanceWorkspaceTableShell,
} from "@/features/attendance/components/attendance-workspace-panel";
import {
  deriveDeviceNameFromUserAgent,
  formatStaffDeviceStatusLabel,
  getStaffDeviceStatusTone,
} from "@/features/attendance/device-utils";
import type { AttendanceDevicesPageData, AttendanceStaffDeviceManagementItem } from "@/features/attendance/types";
import { formatDateTime } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export function AttendanceDevicesPageContent({
  data,
  embedded = false,
  paramPrefix = "device",
}: {
  data: AttendanceDevicesPageData;
  embedded?: boolean;
  paramPrefix?: string;
}) {
  const searchParams = useSearchParams();
  const searchParamName = embedded ? `${paramPrefix}Search` : "search";
  const statusParamName = embedded ? `${paramPrefix}Status` : "status";
  const pageParamName = embedded ? `${paramPrefix}Page` : "page";
  const searchValue = searchParams.get(searchParamName)?.trim() ?? "";
  const search = searchValue.toLowerCase();
  const status = searchParams.get(statusParamName) ?? "";
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const filteredDevices = useMemo(
    () =>
      data.devices.filter((device) => {
        if (status && device.status !== status) {
          return false;
        }

        if (!search) {
          return true;
        }

        return [
          device.staffName,
          device.deviceName ?? "",
          device.userAgent ?? "",
          device.lastIp ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      }),
    [data.devices, search, status],
  );
  const pagination = paginateItems(filteredDevices, searchParams.get(pageParamName) ?? undefined);

  return (
    <div className={embedded ? "w-full min-w-0 max-w-full" : "w-full min-w-0 max-w-full space-y-6"}>
      {embedded ? null : (
        <PageHeader
          title="Mechanic devices"
          description="Approve phones and browsers used for mechanic attendance punches."
          actions={
            <PageHeaderActions
              primary={
                <Button asChild variant="outline">
                  <Link href="/settings/timekeeping">Timekeeping settings</Link>
                </Button>
              }
            />
          }
        />
      )}

      <AttendanceWorkspacePanel
        toolbar={
          <DataTableFilters
            key={`${searchValue}:${status}`}
            className={ATTENDANCE_WORKSPACE_FILTER_GRID}
            search={{
              name: searchParamName,
              value: searchValue,
              placeholder: "Search employee or device",
            }}
            pageParamName={pageParamName}
            filters={[
              {
                type: "select",
                name: statusParamName,
                value: status,
                options: [
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "revoked", label: "Revoked" },
                ],
              },
            ]}
          />
        }
        footer={
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            pageParamName={pageParamName}
          />
        }
      >
        <AttendanceWorkspaceTableShell
          isEmpty={pagination.totalItems === 0}
          emptyState={
            <EmptyState
              title="No devices found"
              description="Mechanic devices appear here after staff attempt attendance from a new browser or phone."
            />
          }
        >
          <Table className="min-w-[720px] xl:min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Employee</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.items.map((device) => (
                <AttendanceDeviceTableRow
                  key={device.id}
                  device={device}
                  expanded={expandedDeviceId === device.id}
                  onToggle={() =>
                    setExpandedDeviceId((currentValue) =>
                      currentValue === device.id ? null : device.id,
                    )
                  }
                />
              ))}
            </TableBody>
          </Table>
        </AttendanceWorkspaceTableShell>
      </AttendanceWorkspacePanel>
    </div>
  );
}

function AttendanceDeviceTableRow({
  device,
  expanded,
  onToggle,
}: {
  device: AttendanceStaffDeviceManagementItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const browserLabel = deriveDeviceNameFromUserAgent(device.userAgent);

  return (
    <Fragment>
      <TableRow>
        <TableCell className="w-10 px-2">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} device details for ${device.staffName}`}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <ChevronDown
              className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")}
            />
          </button>
        </TableCell>
        <TableCell className="font-medium text-foreground">{device.staffName}</TableCell>
        <TableCell className="text-sm text-foreground">
          {device.deviceName?.trim() || browserLabel}
        </TableCell>
        <TableCell>
          <StatusBadge tone={getStaffDeviceStatusTone(device.status)}>
            {formatStaffDeviceStatusLabel(device.status)}
          </StatusBadge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDateTime(device.lastSeenAt)}
        </TableCell>
        <TableCell className="w-24 text-right">
          <AttendanceDeviceRowActions device={device} />
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow className="bg-muted/10 hover:bg-muted/10">
          <TableCell colSpan={6} className="px-4 py-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <DeviceDetailItem label="Browser" value={browserLabel} />
              <DeviceDetailItem label="User agent" value={device.userAgent ?? "Unavailable"} />
              <DeviceDetailItem label="IP address" value={device.lastIp ?? "Unavailable"} />
              <DeviceDetailItem label="First seen" value={formatDateTime(device.firstSeenAt)} />
              <DeviceDetailItem
                label="Approval timestamp"
                value={device.approvedAt ? formatDateTime(device.approvedAt) : "—"}
              />
            </dl>
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );
}

function DeviceDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words text-foreground">{value}</dd>
    </div>
  );
}
