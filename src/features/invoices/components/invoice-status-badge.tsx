import { StatusBadge } from "@/components/shared/status-badge";
import type { InvoiceStatus, PaymentMethod } from "@/features/invoices/types";
import { formatInvoiceStatus, formatPaymentMethod } from "@/features/invoices/utils";

export function InvoiceStatusBadge({
  status,
  variant = "default",
}: {
  status: InvoiceStatus;
  variant?: "default" | "table";
}) {
  const tone =
    status === "paid"
      ? "success"
      : status === "partially_paid" || status === "unpaid"
        ? "warning"
        : status === "cancelled"
          ? "destructive"
          : "neutral";

  return (
    <StatusBadge tone={tone} variant={variant}>
      {formatInvoiceStatus(status)}
    </StatusBadge>
  );
}

export function PaymentMethodBadge({
  method,
  variant = "default",
}: {
  method: PaymentMethod;
  variant?: "default" | "table";
}) {
  const tone = method === "cash" ? "info" : "neutral";
  return (
    <StatusBadge tone={tone} variant={variant}>
      {formatPaymentMethod(method)}
    </StatusBadge>
  );
}
