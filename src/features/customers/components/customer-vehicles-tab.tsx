"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
import { StatusBadge } from "@/components/shared/status-badge";
import { NativeSelect } from "@/components/ui/native-select";
import type { CustomerVehicleSummary } from "@/features/customers/types";
import { formatDate } from "@/lib/dates";

type VehicleRow = CustomerVehicleSummary & {
  lastServiceDate: string | null;
};

type VehicleSortKey = "vehicle" | "plate" | "year" | "status" | "lastService";

export function CustomerVehiclesTab({
  vehicles,
  lastServiceByVehicleId,
}: {
  vehicles: CustomerVehicleSummary[];
  lastServiceByVehicleId: Record<string, string | null>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortKey, setSortKey] = useState<VehicleSortKey>("vehicle");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const yearOptions = useMemo(() => {
    const years = new Set(
      vehicles.map((vehicle) => vehicle.year).filter((year): year is number => year !== null),
    );

    return Array.from(years).sort((left, right) => right - left);
  }, [vehicles]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    const enriched: VehicleRow[] = vehicles.map((vehicle) => ({
      ...vehicle,
      lastServiceDate: lastServiceByVehicleId[vehicle.id] ?? null,
    }));

    const filtered = enriched.filter((vehicle) => {
      if (statusFilter && vehicle.status !== statusFilter) {
        return false;
      }

      if (yearFilter && String(vehicle.year ?? "") !== yearFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        vehicle.make,
        vehicle.model,
        vehicle.plateNumber ?? "",
        vehicle.vin ?? "",
        String(vehicle.year ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    return [...filtered].sort((left, right) => compareVehicleRows(left, right, sortKey, sortDirection));
  }, [lastServiceByVehicleId, search, sortDirection, sortKey, statusFilter, vehicles, yearFilter]);

  function toggleSort(nextKey: VehicleSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  if (vehicles.length === 0) {
    return (
      <EmptyState
        title="No vehicles linked"
        description="Add a vehicle before creating quotations or job orders for this customer."
      />
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search make, model, or plate"
        />
        <NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </NativeSelect>
        <NativeSelect value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
          <option value="">All years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </NativeSelect>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState
          title="No vehicles match your filters"
          description="Try a different search term or clear the current filters."
        />
      ) : (
        <EntityDataTable>
          <EntityDataTableHeader>
            <EntityDataTableRow>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "vehicle" ? sortDirection : false}
                onSort={() => toggleSort("vehicle")}
              >
                Vehicle
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "plate" ? sortDirection : false}
                onSort={() => toggleSort("plate")}
              >
                Plate number
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "year" ? sortDirection : false}
                onSort={() => toggleSort("year")}
              >
                Year
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "status" ? sortDirection : false}
                onSort={() => toggleSort("status")}
              >
                Status
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "lastService" ? sortDirection : false}
                onSort={() => toggleSort("lastService")}
              >
                Last service
              </EntityDataTableHead>
            </EntityDataTableRow>
          </EntityDataTableHeader>
          <EntityDataTableBody>
            {rows.map((vehicle) => (
              <EntityDataTableRow
                key={vehicle.id}
                className="cursor-pointer"
                onClick={() => router.push(`/vehicles/${vehicle.id}`)}
              >
                <EntityDataTableCell className="font-medium text-foreground">
                  {vehicle.make} {vehicle.model}
                </EntityDataTableCell>
                <EntityDataTableCell className="text-muted-foreground">
                  {vehicle.plateNumber ?? "-"}
                </EntityDataTableCell>
                <EntityDataTableCell className="text-muted-foreground">
                  {vehicle.year ?? "-"}
                </EntityDataTableCell>
                <EntityDataTableCell>
                  <StatusBadge tone={vehicle.status === "active" ? "success" : "neutral"}>
                    {vehicle.status}
                  </StatusBadge>
                </EntityDataTableCell>
                <EntityDataTableCell className="text-muted-foreground">
                  {vehicle.lastServiceDate ? formatDate(vehicle.lastServiceDate) : "-"}
                </EntityDataTableCell>
              </EntityDataTableRow>
            ))}
          </EntityDataTableBody>
        </EntityDataTable>
      )}
    </div>
  );
}

function compareVehicleRows(
  left: VehicleRow,
  right: VehicleRow,
  sortKey: VehicleSortKey,
  sortDirection: "asc" | "desc",
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  switch (sortKey) {
    case "vehicle":
      return (
        `${left.make} ${left.model}`.localeCompare(`${right.make} ${right.model}`, undefined, {
          sensitivity: "base",
        }) * direction
      );
    case "plate":
      return (left.plateNumber ?? "").localeCompare(right.plateNumber ?? "", undefined, {
        sensitivity: "base",
      }) * direction;
    case "year":
      return ((left.year ?? 0) - (right.year ?? 0)) * direction;
    case "status":
      return left.status.localeCompare(right.status) * direction;
    case "lastService":
      return (
        (Date.parse(left.lastServiceDate ?? "1970-01-01") -
          Date.parse(right.lastServiceDate ?? "1970-01-01")) *
        direction
      );
  }
}
