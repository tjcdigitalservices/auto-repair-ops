import { StatusBadge } from "@/components/shared/status-badge";
import type { TenantStatus } from "@/lib/tenants/status";

const TONES: Record<
  TenantStatus,
  "success" | "warning" | "destructive" | "info" | "neutral"
> = {
  trial: "info",
  active: "success",
  past_due: "warning",
  suspended: "destructive",
  canceled: "neutral",
};

const LABELS: Record<TenantStatus, string> = {
  trial: "Trial",
  active: "Active",
  past_due: "Past due",
  suspended: "Suspended",
  canceled: "Canceled",
};

export function TenantStatusBadge({
  status,
  variant = "default",
}: {
  status: TenantStatus;
  variant?: "default" | "table";
}) {
  return (
    <StatusBadge tone={TONES[status]} variant={variant}>
      {LABELS[status]}
    </StatusBadge>
  );
}
