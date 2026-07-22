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

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <StatusBadge tone={TONES[status]}>{status.replace("_", " ")}</StatusBadge>
  );
}
