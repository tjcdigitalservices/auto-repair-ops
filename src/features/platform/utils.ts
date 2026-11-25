import {
  PLATFORM_TENANT_TABS,
  type PlatformTenantTab,
} from "@/features/platform/types";

export function resolvePlatformTenantTab(
  value: string | string[] | undefined,
): PlatformTenantTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && (PLATFORM_TENANT_TABS as readonly string[]).includes(raw)) {
    return raw as PlatformTenantTab;
  }
  return "overview";
}

export function formatPlanLabel(planKey: string) {
  if (!planKey) return "—";
  return planKey.charAt(0).toUpperCase() + planKey.slice(1);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRoleLabel(role: string) {
  return role.replaceAll("_", " ");
}
