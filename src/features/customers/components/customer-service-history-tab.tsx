"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  EntityDataTable,
  EntityDataTableBody,
  EntityDataTableCell,
  EntityDataTableHead,
  EntityDataTableHeader,
  EntityDataTableRow,
} from "@/components/shared/entity-detail";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { NativeSelect } from "@/components/ui/native-select";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import type { JobOrderStatus } from "@/features/job-orders/types";
import { ServiceHistoryItemDetails } from "@/features/service-history/components/service-history-item-details";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import { buildServiceHistorySummary } from "@/features/service-history/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type ServiceHistorySortKey = "date" | "jobOrder" | "vehicle" | "status" | "total";

export function CustomerServiceHistoryTab({
  entries,
  canViewServiceHistory,
  hideVehicleContext = false,
}: {
  entries: ServiceHistoryEntry[];
  canViewServiceHistory: boolean;
  hideVehicleContext?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortKey, setSortKey] = useState<ServiceHistorySortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const vehicleOptions = useMemo(() => {
    const labels = new Set(entries.map((entry) => entry.vehicleLabel).filter(Boolean));
    return Array.from(labels).sort((left, right) => left.localeCompare(right));
  }, [entries]);

  const statusOptions = useMemo(() => {
    const statuses = new Set(entries.map((entry) => entry.status));
    return Array.from(statuses).sort((left, right) => left.localeCompare(right));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = entries.filter((entry) => {
      const completionDate = entry.completedAt ?? entry.releasedAt ?? entry.serviceDate;

      if (dateFilter && !completionDate.startsWith(dateFilter)) {
        return false;
      }

      if (!hideVehicleContext && vehicleFilter && entry.vehicleLabel !== vehicleFilter) {
        return false;
      }

      if (statusFilter && entry.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        entry.jobOrderNumber,
        entry.vehicleLabel,
        entry.customerConcern ?? "",
        buildServiceHistorySummary(entry),
        entry.mechanics.map((mechanic) => mechanic.fullName).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    return [...filtered].sort((left, right) =>
      compareServiceHistoryEntries(left, right, sortKey, sortDirection),
    );
  }, [dateFilter, entries, hideVehicleContext, search, sortDirection, sortKey, statusFilter, vehicleFilter]);

  function toggleSort(nextKey: ServiceHistorySortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "date" || nextKey === "total" ? "desc" : "asc");
  }

  if (!canViewServiceHistory) {
    return (
      <EmptyState
        title="Service history is unavailable"
        description={
          hideVehicleContext
            ? "This staff role does not have access to job order history for this vehicle."
            : "This staff role does not have access to job order history for this customer."
        }
      />
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No service history yet"
        description={
          hideVehicleContext
            ? "Completed or active job orders for this vehicle will appear here."
            : "Completed or active job orders for this customer's vehicles will appear here."
        }
      />
    );
  }

  const columnCount = hideVehicleContext ? 6 : 7;

  return (
    <div className="space-y-4">
      <FilterBar
        className={
          hideVehicleContext
            ? "grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px]"
            : "grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]"
        }
      >
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            hideVehicleContext
              ? "Search job order or concern"
              : "Search job order, vehicle, or concern"
          }
        />
        <NativeSelect value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
          <option value="">All dates</option>
          {buildMonthOptions(entries).map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </NativeSelect>
        {hideVehicleContext ? null : (
          <NativeSelect value={vehicleFilter} onChange={(event) => setVehicleFilter(event.target.value)}>
            <option value="">All vehicles</option>
            {vehicleOptions.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </NativeSelect>
        )}
        <NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </NativeSelect>
      </FilterBar>

      {filteredEntries.length === 0 ? (
        <EmptyState
          title="No service history matches your filters"
          description="Try a different search term or clear the current filters."
        />
      ) : (
        <EntityDataTable>
          <EntityDataTableHeader>
            <EntityDataTableRow>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "jobOrder" ? sortDirection : false}
                onSort={() => toggleSort("jobOrder")}
              >
                Job order
              </EntityDataTableHead>
              {hideVehicleContext ? null : (
                <EntityDataTableHead
                  sortable
                  sorted={sortKey === "vehicle" ? sortDirection : false}
                  onSort={() => toggleSort("vehicle")}
                >
                  Vehicle
                </EntityDataTableHead>
              )}
              <EntityDataTableHead
                sortable
                sorted={sortKey === "date" ? sortDirection : false}
                onSort={() => toggleSort("date")}
              >
                Date
              </EntityDataTableHead>
              <EntityDataTableHead>Concern</EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "status" ? sortDirection : false}
                onSort={() => toggleSort("status")}
              >
                Status
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "total" ? sortDirection : false}
                onSort={() => toggleSort("total")}
              >
                Total
              </EntityDataTableHead>
              <EntityDataTableHead className="w-10">
                <span className="sr-only">Expand</span>
              </EntityDataTableHead>
            </EntityDataTableRow>
          </EntityDataTableHeader>
          <EntityDataTableBody>
            {filteredEntries.map((entry) => {
              const completionDate = entry.completedAt ?? entry.releasedAt ?? entry.serviceDate;
              const isExpanded = expandedId === entry.id;

              return (
                <Fragment key={entry.id}>
                  <EntityDataTableRow
                    className="cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    aria-expanded={isExpanded}
                  >
                    <EntityDataTableCell>
                      <Link
                        href={`/job-orders/${entry.jobOrderId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {entry.jobOrderNumber}
                      </Link>
                    </EntityDataTableCell>
                    {hideVehicleContext ? null : (
                      <EntityDataTableCell className="text-muted-foreground">
                        {entry.vehicleLabel || "-"}
                      </EntityDataTableCell>
                    )}
                    <EntityDataTableCell className="text-muted-foreground">
                      {formatDate(completionDate)}
                    </EntityDataTableCell>
                    <EntityDataTableCell className="max-w-[220px]">
                      <p className="line-clamp-2 text-sm text-foreground">
                        {entry.customerConcern?.trim() || "-"}
                      </p>
                    </EntityDataTableCell>
                    <EntityDataTableCell>
                      <JobOrderStatusBadge status={entry.status} />
                    </EntityDataTableCell>
                    <EntityDataTableCell className="font-medium">
                      {formatCurrency(entry.totalAmount)}
                    </EntityDataTableCell>
                    <EntityDataTableCell className="text-right">
                      <ChevronDown
                        className={cn(
                          "ml-auto size-4 text-muted-foreground transition-transform duration-200",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </EntityDataTableCell>
                  </EntityDataTableRow>
                  {isExpanded ? (
                    <EntityDataTableRow className="hover:bg-transparent">
                      <EntityDataTableCell colSpan={columnCount} className="bg-muted/10 py-4">
                        <ServiceHistoryItemDetails entry={entry} />
                      </EntityDataTableCell>
                    </EntityDataTableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </EntityDataTableBody>
        </EntityDataTable>
      )}
    </div>
  );
}

function compareServiceHistoryEntries(
  left: ServiceHistoryEntry,
  right: ServiceHistoryEntry,
  sortKey: ServiceHistorySortKey,
  sortDirection: "asc" | "desc",
) {
  const direction = sortDirection === "asc" ? 1 : -1;
  const leftDate = left.completedAt ?? left.releasedAt ?? left.serviceDate;
  const rightDate = right.completedAt ?? right.releasedAt ?? right.serviceDate;

  switch (sortKey) {
    case "date":
      return (Date.parse(leftDate) - Date.parse(rightDate)) * direction;
    case "jobOrder":
      return left.jobOrderNumber.localeCompare(right.jobOrderNumber) * direction;
    case "vehicle":
      return left.vehicleLabel.localeCompare(right.vehicleLabel) * direction;
    case "status":
      return left.status.localeCompare(right.status) * direction;
    case "total":
      return (left.totalAmount - right.totalAmount) * direction;
  }
}

function buildMonthOptions(entries: ServiceHistoryEntry[]) {
  return Array.from(
    new Set(
      entries.map((entry) => {
        const date = entry.completedAt ?? entry.releasedAt ?? entry.serviceDate;
        return date.slice(0, 7);
      }),
    ),
  ).sort((left, right) => right.localeCompare(left));
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatStatusLabel(status: JobOrderStatus) {
  return status.replaceAll("_", " ");
}
