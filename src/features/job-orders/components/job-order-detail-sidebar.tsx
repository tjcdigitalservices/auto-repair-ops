import {
  EntityDetailField,
  EntityDetailLink,
  EntityDetailSection,
} from "@/components/shared/entity-detail";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import type { JobOrderDetail } from "@/features/job-orders/types";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

export function JobOrderDetailSidebar({ jobOrder }: { jobOrder: JobOrderDetail }) {
  return (
    <>
      <EntityDetailSection title="Customer & vehicle">
        <div className="space-y-4">
          <EntityDetailField label="Customer">
            <EntityDetailLink href={`/customers/${jobOrder.customerId}`}>
              {jobOrder.customerName}
            </EntityDetailLink>
          </EntityDetailField>
          <EntityDetailField label="Vehicle">
            <EntityDetailLink href={`/vehicles/${jobOrder.vehicleId}`}>
              {jobOrder.vehicleLabel}
            </EntityDetailLink>
          </EntityDetailField>
          <EntityDetailField label="Quotation">
            {jobOrder.quotationId && jobOrder.quotationNumber ? (
              <EntityDetailLink href={`/quotations/${jobOrder.quotationId}`}>
                {jobOrder.quotationNumber}
              </EntityDetailLink>
            ) : null}
          </EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Billing">
        <div className="space-y-4">
          <EntityDetailField label="Invoice">
            {jobOrder.invoiceId && jobOrder.invoiceNumber ? (
              <EntityDetailLink href={`/invoices/${jobOrder.invoiceId}`}>
                {jobOrder.invoiceNumber}
              </EntityDetailLink>
            ) : null}
          </EntityDetailField>
          <EntityDetailField label="Invoice status">
            {jobOrder.invoiceStatus ? (
              <InvoiceStatusBadge status={jobOrder.invoiceStatus} />
            ) : null}
          </EntityDetailField>
          <EntityDetailField label="Paid">
            {jobOrder.invoiceId
              ? `${formatCurrency(jobOrder.invoicePaidAmount ?? 0)} of ${formatCurrency(jobOrder.invoiceTotalAmount ?? 0)}`
              : null}
          </EntityDetailField>
          <EntityDetailField label="Balance">
            {jobOrder.invoiceId ? formatCurrency(jobOrder.invoiceBalance ?? 0) : null}
          </EntityDetailField>
          <EntityDetailField label="Billable total">
            {formatCurrency(jobOrder.billableTotal)}
          </EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Timeline">
        <div className="space-y-4">
          <EntityDetailField label="Created">
            {formatDateTime(jobOrder.createdAt)}
          </EntityDetailField>
          <EntityDetailField label="Started">
            {jobOrder.startedAt ? formatDateTime(jobOrder.startedAt) : null}
          </EntityDetailField>
          <EntityDetailField label="Completed">
            {jobOrder.completedAt ? formatDateTime(jobOrder.completedAt) : null}
          </EntityDetailField>
          <EntityDetailField label="Released">
            {jobOrder.releasedAt ? formatDateTime(jobOrder.releasedAt) : null}
          </EntityDetailField>
          <EntityDetailField label="Mechanics">
            {`${jobOrder.mechanics.length} assigned`}
          </EntityDetailField>
        </div>
      </EntityDetailSection>
    </>
  );
}
