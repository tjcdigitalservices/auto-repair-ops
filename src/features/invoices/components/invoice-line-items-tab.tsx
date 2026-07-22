"use client";

import { useMemo, useState } from "react";

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
import type { InvoiceItemDetail } from "@/features/invoices/types";
import { formatCurrency } from "@/lib/currency";

type ItemSortKey = "line" | "type" | "description" | "quantity" | "unitPrice" | "total";

export function InvoiceLineItemsTab({ items }: { items: InvoiceItemDetail[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState<ItemSortKey>("line");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (typeFilter && item.itemType !== typeFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.description.toLowerCase().includes(query) ||
        item.itemType.toLowerCase().includes(query) ||
        String(item.lineNumber).includes(query)
      );
    });

    return [...filtered].sort((left, right) => compareItems(left, right, sortKey, sortDirection));
  }, [items, search, sortDirection, sortKey, typeFilter]);

  function toggleSort(nextKey: ItemSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No invoice items"
        description="Billable lines are captured when the invoice is created."
      />
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px]">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search description or type"
        />
        <NativeSelect value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">All types</option>
          <option value="product">Product</option>
          <option value="service">Service</option>
          <option value="labor">Labor</option>
        </NativeSelect>
      </FilterBar>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="No line items match your filters"
          description="Try a different search term or clear the current filters."
        />
      ) : (
        <EntityDataTable>
          <EntityDataTableHeader>
            <EntityDataTableRow>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "line" ? sortDirection : false}
                onSort={() => toggleSort("line")}
              >
                Line
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "description" ? sortDirection : false}
                onSort={() => toggleSort("description")}
              >
                Description
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "type" ? sortDirection : false}
                onSort={() => toggleSort("type")}
              >
                Type
              </EntityDataTableHead>
              <EntityDataTableHead
                sortable
                sorted={sortKey === "quantity" ? sortDirection : false}
                onSort={() => toggleSort("quantity")}
              >
                Qty
              </EntityDataTableHead>
              <EntityDataTableHead
                className="text-right"
                sortable
                sorted={sortKey === "unitPrice" ? sortDirection : false}
                onSort={() => toggleSort("unitPrice")}
              >
                Unit price
              </EntityDataTableHead>
              <EntityDataTableHead
                className="text-right"
                sortable
                sorted={sortKey === "total" ? sortDirection : false}
                onSort={() => toggleSort("total")}
              >
                Total
              </EntityDataTableHead>
            </EntityDataTableRow>
          </EntityDataTableHeader>
          <EntityDataTableBody>
            {filteredItems.map((item) => (
              <EntityDataTableRow key={item.id}>
                <EntityDataTableCell className="text-muted-foreground">
                  {item.lineNumber}
                </EntityDataTableCell>
                <EntityDataTableCell className="font-medium">{item.description}</EntityDataTableCell>
                <EntityDataTableCell className="capitalize text-muted-foreground">
                  {item.itemType}
                </EntityDataTableCell>
                <EntityDataTableCell className="text-muted-foreground">{item.quantity}</EntityDataTableCell>
                <EntityDataTableCell className="text-right font-medium">
                  {formatCurrency(item.unitPrice)}
                </EntityDataTableCell>
                <EntityDataTableCell className="text-right font-medium">
                  {formatCurrency(item.total)}
                </EntityDataTableCell>
              </EntityDataTableRow>
            ))}
          </EntityDataTableBody>
        </EntityDataTable>
      )}
    </div>
  );
}

function compareItems(
  left: InvoiceItemDetail,
  right: InvoiceItemDetail,
  sortKey: ItemSortKey,
  sortDirection: "asc" | "desc",
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  switch (sortKey) {
    case "line":
      return (left.lineNumber - right.lineNumber) * direction;
    case "type":
      return left.itemType.localeCompare(right.itemType) * direction;
    case "description":
      return left.description.localeCompare(right.description) * direction;
    case "quantity":
      return (left.quantity - right.quantity) * direction;
    case "unitPrice":
      return (left.unitPrice - right.unitPrice) * direction;
    case "total":
      return (left.total - right.total) * direction;
  }
}
