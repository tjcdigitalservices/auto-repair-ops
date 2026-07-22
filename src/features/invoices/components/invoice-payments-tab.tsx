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
import { SectionCard } from "@/components/shared/section-card";
import { NativeSelect } from "@/components/ui/native-select";
import { CancelInvoiceDialog } from "@/features/invoices/components/cancel-invoice-dialog";
import { PaymentMethodBadge } from "@/features/invoices/components/invoice-status-badge";
import { RecordPaymentForm } from "@/features/invoices/components/record-payment-form";
import { ReleaseVehicleForm } from "@/features/invoices/components/release-vehicle-form";
import type { InvoiceDetail, InvoicePaymentEntry } from "@/features/invoices/types";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

type PaymentSortKey = "date" | "amount" | "method";

export function InvoicePaymentsTab({
  invoice,
  canCancel,
}: {
  invoice: InvoiceDetail;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [sortKey, setSortKey] = useState<PaymentSortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = invoice.payments.filter((payment) => {
      if (methodFilter && payment.paymentMethod !== methodFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        payment.paymentMethod.toLowerCase().includes(query) ||
        (payment.referenceNumber?.toLowerCase().includes(query) ?? false) ||
        (payment.notes?.toLowerCase().includes(query) ?? false) ||
        formatCurrency(payment.amount).toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((left, right) =>
      comparePayments(left, right, sortKey, sortDirection),
    );
  }, [invoice.payments, methodFilter, search, sortDirection, sortKey]);

  function toggleSort(nextKey: PaymentSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "date" || nextKey === "amount" ? "desc" : "asc");
  }

  return (
    <div className="space-y-6">
      {invoice.payments.length === 0 ? (
        <EmptyState
          title="No payments recorded"
          description="Record the first payment to start the collection trail."
        />
      ) : (
        <div className="space-y-4">
          <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px]">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search amount, reference, or notes"
            />
            <NativeSelect
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
            >
              <option value="">All methods</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="card">Card</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </NativeSelect>
          </FilterBar>

          {filteredPayments.length === 0 ? (
            <EmptyState
              title="No payments match your filters"
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
                    className="text-right"
                    sortable
                    sorted={sortKey === "amount" ? sortDirection : false}
                    onSort={() => toggleSort("amount")}
                  >
                    Amount
                  </EntityDataTableHead>
                  <EntityDataTableHead
                    sortable
                    sorted={sortKey === "method" ? sortDirection : false}
                    onSort={() => toggleSort("method")}
                  >
                    Method
                  </EntityDataTableHead>
                  <EntityDataTableHead>Reference</EntityDataTableHead>
                  <EntityDataTableHead>Notes</EntityDataTableHead>
                </EntityDataTableRow>
              </EntityDataTableHeader>
              <EntityDataTableBody>
                {filteredPayments.map((payment) => (
                  <EntityDataTableRow
                    key={payment.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/payments/${payment.id}`)}
                  >
                    <EntityDataTableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(payment.paidAt)}
                    </EntityDataTableCell>
                    <EntityDataTableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </EntityDataTableCell>
                    <EntityDataTableCell>
                      <PaymentMethodBadge method={payment.paymentMethod} />
                    </EntityDataTableCell>
                    <EntityDataTableCell className="text-muted-foreground">
                      {payment.referenceNumber?.trim() || "-"}
                    </EntityDataTableCell>
                    <EntityDataTableCell className="max-w-[240px] truncate text-muted-foreground">
                      {payment.notes?.trim() || "-"}
                    </EntityDataTableCell>
                  </EntityDataTableRow>
                ))}
              </EntityDataTableBody>
            </EntityDataTable>
          )}
        </div>
      )}

      {invoice.canRecordPayment ? (
        <SectionCard
          title="Record payment"
          description="The branch payment rules decide whether partial payments are accepted."
        >
          <RecordPaymentForm
            invoiceId={invoice.id}
            jobOrderId={invoice.jobOrderId}
            balance={invoice.balance}
            allowPartialPayments={invoice.allowPartialPayments}
          />
        </SectionCard>
      ) : null}

      {invoice.canReleaseVehicle && invoice.jobOrderId ? (
        <SectionCard
          title="Release vehicle"
          description="Release is still checked server-side against branch settings and invoice balance."
        >
          <ReleaseVehicleForm
            jobOrderId={invoice.jobOrderId}
            balance={invoice.balance}
            allowReleaseWithBalance={invoice.allowReleaseWithBalance}
            requireFullPaymentBeforeRelease={invoice.requireFullPaymentBeforeRelease}
          />
        </SectionCard>
      ) : null}

      {canCancel ? (
        <SectionCard
          title="Cancel invoice"
          description="Use this only for unpaid service invoices that need to be voided without deleting the record."
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Cancellation is blocked once payments exist, the vehicle has been released, or the
              invoice came from a POS sale.
            </div>
            <CancelInvoiceDialog
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
            />
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

function comparePayments(
  left: InvoicePaymentEntry,
  right: InvoicePaymentEntry,
  sortKey: PaymentSortKey,
  sortDirection: "asc" | "desc",
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  switch (sortKey) {
    case "date":
      return (Date.parse(left.paidAt) - Date.parse(right.paidAt)) * direction;
    case "amount":
      return (left.amount - right.amount) * direction;
    case "method":
      return left.paymentMethod.localeCompare(right.paymentMethod) * direction;
  }
}
