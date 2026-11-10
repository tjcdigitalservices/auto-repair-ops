import Link from "next/link";

import { BranchSelector } from "@/components/shared/branch-selector";
import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingRowActions } from "@/features/bookings/components/booking-row-actions";
import type { BookingListItem, BookingStatus } from "@/features/bookings/types";
import {
  getBookingServiceKindLabel,
  getBookingStatusLabel,
  getBookingStatusTone,
} from "@/features/bookings/utils";
import { formatDateTime } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export function BookingsListPanel({
  bookings,
  search,
  status,
  page,
  branch,
}: {
  bookings: BookingListItem[];
  search: string;
  status: "" | BookingStatus;
  page?: string;
  branch: { id: string; name: string; code: string };
}) {
  const pagination = paginateItems(bookings, page);

  return (
    <DataTableCard
      toolbar={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <BranchSelector
            branches={[branch]}
            selectedBranchId={branch.id}
            canSwitch={false}
            className="w-full lg:w-[12rem]"
          />
          <DataTableFilters
            key={`${search}:${status}`}
            className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              value: search,
              placeholder: "Search customer, vehicle, or concern",
            }}
            filters={[
              {
                type: "select",
                name: "status",
                value: status,
                options: [
                  { value: "", label: "All statuses" },
                  { value: "requested", label: "Requested" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "checked_in", label: "Checked in" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "no_show", label: "No-show" },
                ],
              },
            ]}
          />
        </div>
      }
      footer={
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          startItem={pagination.startItem}
          endItem={pagination.endItem}
        />
      }
    >
      {pagination.totalItems === 0 ? (
        <EmptyState
          title="No bookings found"
          description="Customer appointment requests will appear here when they book through the portal or your team adds them."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schedule</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Concern</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[3rem]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.items.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDateTime(booking.scheduledStart)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/customers/${booking.customerId}`}
                    className="font-medium text-brand-navy hover:underline"
                  >
                    {booking.customerName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/vehicles/${booking.vehicleId}`}
                    className="text-brand-navy hover:underline"
                  >
                    {booking.vehicleLabel}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getBookingServiceKindLabel(booking.serviceKind)}
                </TableCell>
                <TableCell className="max-w-[16rem] truncate text-sm text-muted-foreground">
                  {booking.customerConcern || "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={getBookingStatusTone(booking.status)} variant="table">
                    {getBookingStatusLabel(booking.status)}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <BookingRowActions booking={booking} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTableCard>
  );
}
