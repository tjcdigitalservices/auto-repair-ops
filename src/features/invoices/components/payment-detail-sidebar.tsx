import {
  EntityDetailField,
  EntityDetailLink,
  EntityDetailSection,
} from "@/components/shared/entity-detail";
import type { PaymentDetail } from "@/features/invoices/types";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export function PaymentDetailSidebar({ payment }: { payment: PaymentDetail }) {
  return (
    <>
      <EntityDetailSection title="Customer & vehicle">
        <div className="space-y-4">
          <EntityDetailField label="Customer">
            {payment.customerId ? (
              <EntityDetailLink href={`/customers/${payment.customerId}`}>
                {payment.customerName}
              </EntityDetailLink>
            ) : (
              payment.customerName
            )}
          </EntityDetailField>
          <EntityDetailField label="Contact">{payment.customerContactNumber}</EntityDetailField>
          <EntityDetailField label="Vehicle">
            {payment.vehicleId ? (
              <EntityDetailLink href={`/vehicles/${payment.vehicleId}`}>
                {payment.vehicleLabel}
              </EntityDetailLink>
            ) : (
              payment.vehicleLabel
            )}
          </EntityDetailField>
          <EntityDetailField label="Address">
            {payment.customerAddress?.trim() ? (
              <p className="whitespace-pre-wrap font-normal leading-6">
                {payment.customerAddress.trim()}
              </p>
            ) : null}
          </EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Invoice">
        <div className="space-y-4">
          <EntityDetailField label="Invoice">
            <EntityDetailLink href={`/invoices/${payment.invoiceId}`}>
              {payment.invoiceNumber}
            </EntityDetailLink>
          </EntityDetailField>
          <EntityDetailField label="Invoice date">{formatDate(payment.invoiceDate)}</EntityDetailField>
          <EntityDetailField label="Invoice total">
            {formatCurrency(payment.invoiceTotalAmount)}
          </EntityDetailField>
          <EntityDetailField label="Paid on invoice">
            {formatCurrency(payment.invoicePaidAmount)}
          </EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Source">
        <EntityDetailField label="Source">
          {payment.jobOrderId && payment.jobOrderNumber ? (
            <EntityDetailLink href={`/job-orders/${payment.jobOrderId}`}>
              {payment.jobOrderNumber}
            </EntityDetailLink>
          ) : (
            payment.saleNumber ?? "Direct sale"
          )}
        </EntityDetailField>
      </EntityDetailSection>

      <EntityDetailSection title="Receipt">
        <div className="space-y-4">
          <EntityDetailField label="Reference">{payment.referenceNumber}</EntityDetailField>
          <EntityDetailField label="Received by">
            {payment.receivedByName
              ? payment.receivedByTitle
                ? `${payment.receivedByName} · ${formatLabel(payment.receivedByTitle)}`
                : payment.receivedByName
              : null}
          </EntityDetailField>
          <EntityDetailField label="Recorded">{formatDateTime(payment.createdAt)}</EntityDetailField>
        </div>
      </EntityDetailSection>
    </>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
