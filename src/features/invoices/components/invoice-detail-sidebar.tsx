import {
  EntityDetailField,
  EntityDetailLink,
  EntityDetailSection,
} from "@/components/shared/entity-detail";
import type { InvoiceDetail } from "@/features/invoices/types";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export function InvoiceDetailSidebar({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <>
      <EntityDetailSection title="Customer & vehicle">
        <div className="space-y-4">
          <EntityDetailField label="Customer">
            {invoice.customerId ? (
              <EntityDetailLink href={`/customers/${invoice.customerId}`}>
                {invoice.customerName}
              </EntityDetailLink>
            ) : (
              invoice.customerName
            )}
          </EntityDetailField>
          <EntityDetailField label="Vehicle">
            {invoice.vehicleId ? (
              <EntityDetailLink href={`/vehicles/${invoice.vehicleId}`}>
                {invoice.vehicleLabel}
              </EntityDetailLink>
            ) : (
              invoice.vehicleLabel
            )}
          </EntityDetailField>
          <EntityDetailField label="Source">
            {invoice.jobOrderId && invoice.jobOrderNumber ? (
              <EntityDetailLink href={`/job-orders/${invoice.jobOrderId}`}>
                {invoice.jobOrderNumber}
              </EntityDetailLink>
            ) : (
              invoice.saleNumber ?? "Direct sale"
            )}
          </EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Totals">
        <div className="space-y-4">
          <EntityDetailField label="Invoice date">
            {formatDate(invoice.invoiceDate)}
          </EntityDetailField>
          <EntityDetailField label="Subtotal">{formatCurrency(invoice.subtotal)}</EntityDetailField>
          <EntityDetailField label="Discount">{formatCurrency(invoice.discount)}</EntityDetailField>
          <EntityDetailField label="Tax">{formatCurrency(invoice.tax)}</EntityDetailField>
          <EntityDetailField label="Total">{formatCurrency(invoice.totalAmount)}</EntityDetailField>
          <EntityDetailField label="Paid">{formatCurrency(invoice.paidAmount)}</EntityDetailField>
          <EntityDetailField label="Balance">{formatCurrency(invoice.balance)}</EntityDetailField>
        </div>
      </EntityDetailSection>

      {invoice.status === "cancelled" ? (
        <EntityDetailSection title="Cancellation">
          <div className="space-y-4">
            <EntityDetailField label="Cancelled at">
              {invoice.cancelledAt ? formatDateTime(invoice.cancelledAt) : null}
            </EntityDetailField>
            <EntityDetailField label="Reason">
              {invoice.cancellationReason?.trim() ? (
                <p className="whitespace-pre-wrap font-normal leading-6">
                  {invoice.cancellationReason.trim()}
                </p>
              ) : null}
            </EntityDetailField>
          </div>
        </EntityDetailSection>
      ) : null}

      {invoice.releasedAt ? (
        <EntityDetailSection title="Release">
          <EntityDetailField label="Vehicle released">
            {formatDateTime(invoice.releasedAt)}
          </EntityDetailField>
        </EntityDetailSection>
      ) : null}
    </>
  );
}
