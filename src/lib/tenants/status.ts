import type { TableRow } from "@/types/database";

export type TenantStatus = TableRow<"tenants">["status"];

export const OPERABLE_TENANT_STATUSES: readonly TenantStatus[] = [
  "trial",
  "active",
  "past_due",
] as const;

export function isTenantOperable(status: TenantStatus) {
  return (OPERABLE_TENANT_STATUSES as readonly string[]).includes(status);
}
