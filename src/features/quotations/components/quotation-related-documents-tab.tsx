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
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import type { InvoiceStatus } from "@/features/invoices/types";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import type { JobOrderStatus } from "@/features/job-orders/types";
import { formatDate } from "@/lib/dates";

export type QuotationRelatedDocument =
  | {
      id: string;
      documentType: "job_order";
      documentLabel: string;
      documentHref: string;
      status: JobOrderStatus;
      occurredAt: string;
    }
  | {
      id: string;
      documentType: "invoice";
      documentLabel: string;
      documentHref: string;
      status: InvoiceStatus;
      occurredAt: string;
    };

type DocumentSortKey = "date" | "document" | "type";

export function QuotationRelatedDocumentsTab({
  documents,
}: {
  documents: QuotationRelatedDocument[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState<DocumentSortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = documents.filter((entry) => {
      if (typeFilter && entry.documentType !== typeFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        entry.documentLabel.toLowerCase().includes(query) ||
        entry.documentType.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((left, right) => compareDocuments(left, right, sortKey, sortDirection));
  }, [documents, search, sortDirection, sortKey, typeFilter]);

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
        title="No related documents yet"
        description="A job order appears here after this quotation is approved. Invoices follow from the job order."
      />
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px]">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search document number"
        />
        <NativeSelect value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">All types</option>
          <option value="job_order">Job order</option>
          <option value="invoice">Invoice</option>
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
              <EntityDataTableHead
                sortable
                sorted={sortKey === "type" ? sortDirection : false}
                onSort={() => toggleSort("type")}
              >
                Type
              </EntityDataTableHead>
              <EntityDataTableHead>Status</EntityDataTableHead>
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
                <EntityDataTableCell className="font-medium text-foreground">
                  {entry.documentLabel}
                </EntityDataTableCell>
                <EntityDataTableCell className="capitalize text-muted-foreground">
                  {formatDocumentType(entry.documentType)}
                </EntityDataTableCell>
                <EntityDataTableCell>
                  {entry.documentType === "job_order" ? (
                    <JobOrderStatusBadge status={entry.status} />
                  ) : (
                    <InvoiceStatusBadge status={entry.status} />
                  )}
                </EntityDataTableCell>
              </EntityDataTableRow>
            ))}
          </EntityDataTableBody>
        </EntityDataTable>
      )}
    </div>
  );
}

function formatDocumentType(value: QuotationRelatedDocument["documentType"]) {
  return value.replaceAll("_", " ");
}

function compareDocuments(
  left: QuotationRelatedDocument,
  right: QuotationRelatedDocument,
  sortKey: DocumentSortKey,
  sortDirection: "asc" | "desc",
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  switch (sortKey) {
    case "date":
      return (Date.parse(left.occurredAt) - Date.parse(right.occurredAt)) * direction;
    case "document":
      return left.documentLabel.localeCompare(right.documentLabel) * direction;
    case "type":
      return left.documentType.localeCompare(right.documentType) * direction;
  }
}
