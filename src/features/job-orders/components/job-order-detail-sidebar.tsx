import {
  EntityDetailField,
  EntityDetailLink,
  EntityDetailSection,
} from "@/components/shared/entity-detail";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { JobOrderWorkflowTimeline } from "@/features/job-orders/components/job-order-workflow-timeline";
import type { JobOrderDetail } from "@/features/job-orders/types";
import { buildJobOrderWorkflowTimeline } from "@/features/job-orders/utils";
import { formatCurrency } from "@/lib/currency";

export function JobOrderDetailSidebar({ jobOrder }: { jobOrder: JobOrderDetail }) {
  const workflowSteps = buildJobOrderWorkflowTimeline({
    status: jobOrder.status,
    createdAt: jobOrder.createdAt,
    startedAt: jobOrder.startedAt,
    completedAt: jobOrder.completedAt,
    releasedAt: jobOrder.releasedAt,
    quotationId: jobOrder.quotationId,
    quotationApprovedAt: jobOrder.quotationApprovedAt,
    invoiceId: jobOrder.invoiceId,
    invoiceStatus: jobOrder.invoiceStatus,
  });

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
          <EntityDetailField label="Mechanics">
            {`${jobOrder.mechanics.length} assigned`}
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

      <EntityDetailSection title="Workflow timeline">
        <JobOrderWorkflowTimeline steps={workflowSteps} />
      </EntityDetailSection>
    </>
  );
}
