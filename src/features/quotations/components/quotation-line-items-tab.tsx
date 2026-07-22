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
import type { QuotationItemDetail, QuotationItemType } from "@/features/quotations/types";
import { formatCurrency } from "@/lib/currency";

type ItemSortKey = "line" | "type" | "description" | "quantity" | "unitPrice" | "total";

export function QuotationLineItemsTab({
  items,
  subtotal,
  discount,
  tax,
  totalAmount,
}: {
  items: QuotationItemDetail[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
}) {
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
        (item.unitLabel?.toLowerCase().includes(query) ?? false)
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
    setSortDirection(nextKey === "line" ? "asc" : "asc");
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No line items yet"
        description="Add products, services, or labor lines on the quotation edit screen."
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
                sorted={sortKey === "type" ? sortDirection : false}
                onSort={() => toggleSort("type")}
              >
                Type
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
                sorted={sortKey === "quantity" ? sortDirection : false}
                onSort={() => toggleSort("quantity")}
              >
                Qty / unit
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
                <EntityDataTableCell className="text-muted-foreground">{item.lineNumber}</EntityDataTableCell>
                <EntityDataTableCell className="capitalize text-muted-foreground">
                  {formatItemType(item.itemType)}
                </EntityDataTableCell>
                <EntityDataTableCell className="font-medium text-foreground">
                  {item.description}
                </EntityDataTableCell>
                <EntityDataTableCell className="text-muted-foreground">
                  {formatQuantityWithUnit(item.quantity, item.unitLabel)}
                </EntityDataTableCell>
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TotalCard label="Subtotal" value={formatCurrency(subtotal)} />
        <TotalCard label="Discount" value={formatCurrency(discount)} />
        <TotalCard label="Tax" value={formatCurrency(tax)} />
        <TotalCard label="Total estimate" value={formatCurrency(totalAmount)} emphasized />
      </div>
    </div>
  );
}

function TotalCard({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/10 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={emphasized ? "mt-1 text-base font-semibold text-foreground" : "mt-1 text-sm font-medium text-slate-600"}>
        {value}
      </p>
    </div>
  );
}

function formatItemType(value: QuotationItemType) {
  return value.replaceAll("_", " ");
}

function formatQuantityWithUnit(quantity: number, unitLabel: string | null) {
  return unitLabel ? `${quantity} ${unitLabel}` : String(quantity);
}

function compareItems(
  left: QuotationItemDetail,
  right: QuotationItemDetail,
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
