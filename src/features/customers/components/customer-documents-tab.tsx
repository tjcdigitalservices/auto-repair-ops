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
import { NativeSelect } from "@/components/ui/native-select";
import type { CustomerDocumentHistoryItem } from "@/features/customers/types";
import { PaymentMethodBadge, InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { QuotationStatusBadge } from "@/features/quotations/components/quotation-status-badge";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

type DocumentSortKey = "date" | "document" | "vehicle" | "amount";

export function CustomerDocumentsTab({
  documents,
  hideVehicleContext = false,
}: {
  documents: CustomerDocumentHistoryItem[];
  hideVehicleContext?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortKey, setSortKey] = useState<DocumentSortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = documents.filter((entry) => {
      if (dateFilter && !entry.occurredAt.startsWith(dateFilter)) {
        return false;
      }

      if (!hideVehicleContext && vehicleFilter && entry.vehicleLabel !== vehicleFilter) {
        return false;
      }

      if (statusFilter) {
        if (entry.documentType === "payment") {
          if (entry.paymentMethod !== statusFilter) {
            return false;
          }
        } else if (entry.status !== statusFilter) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      return (
        entry.documentLabel.toLowerCase().includes(query) ||
        entry.vehicleLabel?.toLowerCase().includes(query) ||
        entry.documentType.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((left, right) => compareDocuments(left, right, sortKey, sortDirection));
  }, [dateFilter, documents, hideVehicleContext, search, sortDirection, sortKey, statusFilter, vehicleFilter]);

  const vehicleOptions = useMemo(() => {
    const labels = new Set(
      documents.map((entry) => entry.vehicleLabel).filter((label): label is string => Boolean(label)),
    );

    return Array.from(labels).sort((left, right) => left.localeCompare(right));
  }, [documents]);

  function toggleSort(nextKey: DocumentSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "date" ? "desc" : "asc");
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description={
          hideVehicleContext
            ? "Quotations, job orders, invoices, and payments for this vehicle will appear here."
            : "Quotations, job orders, invoices, and payments for this customer will appear here."
        }
      />
    );
  }

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
            hideVehicleContext ? "Search document number" : "Search document number or vehicle"
          }
        />
        <NativeSelect value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
          <option value="">All dates</option>
          {buildMonthOptions(documents).map((month) => (
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
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="released">Released</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="gcash">GCash</option>
        </NativeSelect>
      </FilterBar>

      {filteredDocuments.length === 0 ? (
        <EmptyState
          title="No documents match your filters"
          description="Try a different search term or clear the current filters."
        />
      ) : (
        <EntityDataTable>
          <EntityDataTableHeader>
            <EntityDataTableRow>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "date" ? sortDirection : false}
                onSort={() => toggleSort("date")}
              >
                Date
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "document" ? sortDirection : false}
                onSort={() => toggleSort("document")}
              >
                Document
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
              <EntityDataTableHead>Status</EntityDataTableHead>
              <EntityDataTableHead
                className="text-right"
                sortable
                sorted={sortKey === "amount" ? sortDirection : false}
                onSort={() => toggleSort("amount")}
              >
                Amount
              </EntityDataTableHead>
            </EntityDataTableRow>
          </EntityDataTableHeader>
          <EntityDataTableBody>
            {filteredDocuments.map((entry) => (
              <EntityDataTableRow
                key={`${entry.documentType}-${entry.id}`}
                className="cursor-pointer"
                onClick={() => router.push(entry.documentHref)}
              >
                <EntityDataTableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(entry.occurredAt)}
                </EntityDataTableCell>
                <EntityDataTableCell>
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-foreground">{entry.documentLabel}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {formatDocumentType(entry.documentType)}
                    </p>
                  </div>
                </EntityDataTableCell>
                {hideVehicleContext ? null : (
                  <EntityDataTableCell className="max-w-[220px] truncate text-muted-foreground">
                    {entry.vehicleLabel ?? "-"}
                  </EntityDataTableCell>
                )}
                <EntityDataTableCell>{renderDocumentStatus(entry)}</EntityDataTableCell>
                <EntityDataTableCell className="whitespace-nowrap text-right font-medium">
                  {entry.amount === null ? "-" : formatCurrency(entry.amount)}
                </EntityDataTableCell>
              </EntityDataTableRow>
            ))}
          </EntityDataTableBody>
        </EntityDataTable>
      )}
    </div>
  );
}

function formatDocumentType(value: CustomerDocumentHistoryItem["documentType"]) {
  return value.replaceAll("_", " ");
}

function renderDocumentStatus(entry: CustomerDocumentHistoryItem) {
  if (entry.documentType === "quotation") {
    return <QuotationStatusBadge status={entry.status} />;
  }

  if (entry.documentType === "job_order") {
    return <JobOrderStatusBadge status={entry.status} />;
  }

  if (entry.documentType === "invoice") {
    return <InvoiceStatusBadge status={entry.status} />;
  }

  return <PaymentMethodBadge method={entry.paymentMethod} />;
}

function compareDocuments(
  left: CustomerDocumentHistoryItem,
  right: CustomerDocumentHistoryItem,
  sortKey: DocumentSortKey,
  sortDirection: "asc" | "desc",
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  switch (sortKey) {
    case "date":
      return (Date.parse(left.occurredAt) - Date.parse(right.occurredAt)) * direction;
    case "document":
      return left.documentLabel.localeCompare(right.documentLabel) * direction;
    case "vehicle":
      return (left.vehicleLabel ?? "").localeCompare(right.vehicleLabel ?? "") * direction;
    case "amount":
      return ((left.amount ?? 0) - (right.amount ?? 0)) * direction;
  }
}

function buildMonthOptions(documents: CustomerDocumentHistoryItem[]) {
  return Array.from(
    new Set(documents.map((entry) => entry.occurredAt.slice(0, 7))),
  ).sort((left, right) => right.localeCompare(left));
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
