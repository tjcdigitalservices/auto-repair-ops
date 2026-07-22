import { StatusBadge } from "@/components/shared/status-badge";
import type { QuotationStatus } from "@/features/quotations/types";

export function QuotationStatusBadge({
  status,
  variant = "default",
}: {
  status: QuotationStatus;
  variant?: "default" | "table";
}) {
  const tone =
    status === "approved"
      ? "success"
      : status === "pending_approval"
        ? "warning"
        : status === "rejected"
          ? "destructive"
          : "neutral";

  return (
    <StatusBadge tone={tone} variant={variant}>
      {formatQuotationStatus(status)}
    </StatusBadge>
  );
}

export function formatQuotationStatus(status: QuotationStatus) {
  return status.replaceAll("_", " ");
}
