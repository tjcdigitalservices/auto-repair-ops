import type { QuickAccessWorkflowAction } from "@/features/quick-access/workflow";

export const ACTIVE_INTAKE_SESSION_STORAGE_KEY = "quick-access-active-intake-session";

/** Default inactivity window before the intake session expires (2 hours). */
export const ACTIVE_INTAKE_INACTIVITY_MS = 2 * 60 * 60 * 1000;

export type ActiveIntakeSession = {
  customerId: string;
  vehicleId: string;
  customerName: string;
  vehicleLabel: string;
  plateNumber: string;
  workflowState: QuickAccessWorkflowAction["state"];
  workflowStatusLabel: string;
  startedAt: string;
  lastActivityAt: string;
  hasUnsavedWork: boolean;
};

export function readActiveIntakeSession(): ActiveIntakeSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_INTAKE_SESSION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ActiveIntakeSession;

    if (!parsed.customerId || !parsed.vehicleId) {
      return null;
    }

    if (Date.now() - Date.parse(parsed.lastActivityAt) > ACTIVE_INTAKE_INACTIVITY_MS) {
      clearActiveIntakeSession();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeActiveIntakeSession(session: ActiveIntakeSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(ACTIVE_INTAKE_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearActiveIntakeSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(ACTIVE_INTAKE_SESSION_STORAGE_KEY);
}

export function touchActiveIntakeSession(session: ActiveIntakeSession): ActiveIntakeSession {
  const next = {
    ...session,
    lastActivityAt: new Date().toISOString(),
  };

  writeActiveIntakeSession(next);
  return next;
}

export function markActiveIntakeUnsavedWork(hasUnsavedWork: boolean) {
  const current = readActiveIntakeSession();

  if (!current) {
    return;
  }

  writeActiveIntakeSession({
    ...current,
    hasUnsavedWork,
    lastActivityAt: new Date().toISOString(),
  });
}

export function buildQuickAccessIntakeHref(customerId: string, vehicleId: string) {
  const params = new URLSearchParams({
    customerId,
    vehicleId,
  });

  return `/quick-access?${params.toString()}`;
}

export function appendQuickAccessReturnTo(href: string) {
  if (href.startsWith("#")) {
    return href;
  }

  const [path, hash = ""] = href.split("#");
  const url = new URL(path, "http://local");
  url.searchParams.set("returnTo", "/quick-access");

  return `${url.pathname}${url.search}${hash ? `#${hash}` : ""}`;
}
