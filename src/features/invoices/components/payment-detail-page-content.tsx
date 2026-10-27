"use client";

import { ClipboardList, Download, FileText, Printer } from "lucide-react";

import {
  EntityDetailActions,
  EntityDetailField,
  EntityDetailHeader,
  EntityDetailLayout,
  EntityDetailSection,
  EntityDetailSidebar,
  MetadataPill,
} from "@/components/shared/entity-detail";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
  TableRowActionsMenuSeparator,
} from "@/components/shared/table-row-actions-menu";
import { PaymentDetailSidebar } from "@/features/invoices/components/payment-detail-sidebar";
import type { PaymentDetail } from "@/features/invoices/types";
import { formatInvoiceStatus, formatPaymentMethod } from "@/features/invoices/utils";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

export function PaymentDetailPageContent({ payment }: { payment: PaymentDetail }) {
  const sandbox = useSandboxOptional();

  return (
    <EntityDetailLayout
      header={
        <EntityDetailHeader
          title={formatCurrency(payment.amount)}
          description={`${payment.customerName} · ${payment.vehicleLabel}`}
          backHref="/payments"
          backLabel="Back to payments"
          metadata={
            <>
              <MetadataPill>{formatPaymentMethod(payment.paymentMethod)}</MetadataPill>
              <MetadataPill tone={invoiceStatusTone(payment.invoiceStatus)}>
                {formatInvoiceStatus(payment.invoiceStatus)}
              </MetadataPill>
              <MetadataPill>Paid {formatDateTime(payment.paidAt)}</MetadataPill>
            </>
          }
          actions={
            <EntityDetailActions>
              <TableRowActionsMenu label="Payment actions">
                <TableRowActionsMenuButton
                  label="Print receipt"
                  icon={Printer}
                  onSelect={() =>
                    window.open(`/payments/${payment.id}/print`, "_blank", "noopener,noreferrer")
                  }
                />
                {!sandbox ? (
                  <TableRowActionsMenuLink
                    href={`/api/payments/${payment.id}/pdf`}
                    label="Download PDF"
                    icon={Download}
                  />
                ) : null}
                <TableRowActionsMenuSeparator />
                <TableRowActionsMenuLink
                  href={`/invoices/${payment.invoiceId}`}
                  label="View invoice"
                  icon={FileText}
                />
                {payment.jobOrderId ? (
                  <TableRowActionsMenuLink
                    href={`/job-orders/${payment.jobOrderId}`}
                    label="View job order"
                    icon={ClipboardList}
                  />
                ) : null}
              </TableRowActionsMenu>
            </EntityDetailActions>
          }
        />
      }
      sidebar={
        <EntityDetailSidebar>
          <PaymentDetailSidebar payment={payment} />
        </EntityDetailSidebar>
      }
    >
      <div className="space-y-8">
        <EntityDetailSection title="Balance impact">
          <div className="space-y-4">
            <EntityDetailField label="Balance before">
              {formatCurrency(payment.invoiceBalanceBeforePayment)}
            </EntityDetailField>
            <EntityDetailField label="Balance after">
              {formatCurrency(payment.invoiceBalanceAfterPayment)}
            </EntityDetailField>
          </div>
        </EntityDetailSection>

        <EntityDetailSection title="Notes">
          <div className="space-y-4">
            <EntityDetailField label="Reference">{payment.referenceNumber}</EntityDetailField>
            <EntityDetailField label="Notes">
              {payment.notes?.trim() ? (
                <p className="whitespace-pre-wrap text-left font-normal leading-6">
                  {payment.notes.trim()}
                </p>
              ) : null}
            </EntityDetailField>
          </div>
        </EntityDetailSection>
      </div>
    </EntityDetailLayout>
  );
}

function invoiceStatusTone(
  status: PaymentDetail["invoiceStatus"],
): "neutral" | "success" | "warning" | "info" {
  if (status === "paid") {
    return "success";
  }

  if (status === "partially_paid") {
    return "info";
  }

  if (status === "cancelled") {
    return "warning";
  }

  return "neutral";
}
