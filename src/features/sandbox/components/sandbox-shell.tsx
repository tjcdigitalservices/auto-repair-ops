"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/shared/app-shell";
import { Button } from "@/components/ui/button";
import { MechanicPortalClientGuard } from "@/features/attendance/components/mechanic-portal-client-guard";
import { MechanicPortalDeviceBootstrap } from "@/features/attendance/components/mechanic-portal-device-bootstrap";
import { MechanicPortalHeaderCard } from "@/features/attendance/components/mechanic-portal-header-card";
import { stripSandboxBasePath } from "@/features/sandbox/constants";
import { getRoleCapabilities } from "@/lib/auth/permissions";
import { DASHBOARD_NAV_ITEMS } from "@/lib/navigation";
import { readSandboxShop, resetSandboxShop, subscribeSandboxShop, loadSandboxShop } from "@/features/sandbox/store";
import { SandboxModeProvider } from "@/features/sandbox/use-bound-action";

const ROLE_LABEL = "Owner";

export function SandboxShell({ children }: { children: React.ReactNode }) {
  const path = stripSandboxBasePath(usePathname());
  const isPrintDocument = path.endsWith("/print");
  const snapshot = useSyncExternalStore(subscribeSandboxShop, readSandboxShop, readSandboxShop);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSandboxShop()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not open the sample shop.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="grid min-h-svh place-items-center bg-slate-50 px-6 text-sm text-slate-700">
        {loadError}
      </div>
    );
  }

  if (!ready || !snapshot) {
    return (
      <div className="grid min-h-svh place-items-center bg-slate-50 px-6 text-sm text-slate-600">
        Opening the sample shop…
      </div>
    );
  }

  const owner = snapshot.staff.find((member) => member.role === "owner");
  const mechanic = snapshot.staff.find((member) => member.role === "mechanic");
  const mechanicName = mechanic ? `${mechanic.firstName} ${mechanic.lastName}` : "Mechanic";
  const navigationItems = DASHBOARD_NAV_ITEMS.filter((item) =>
    (item.requiredCapabilities ?? [item.capability]).every((capability) =>
      getRoleCapabilities("owner").includes(capability),
    ),
  ).map(({ capability: _capability, requiredCapabilities: _requiredCapabilities, ...item }) => item);

  if (isPrintDocument) {
    return (
      <SandboxModeProvider>
        <div className="min-h-svh bg-slate-50">{children}</div>
      </SandboxModeProvider>
    );
  }

  return (
    <SandboxModeProvider>
      <div className="min-h-svh bg-slate-50">
        <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
          <p>
            {path.startsWith("/portal")
              ? `Sandbox — viewing as ${mechanicName}, mechanic. Saved only in this browser.`
              : "Sandbox — saved only in this browser."}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                window.location.assign(path.startsWith("/portal") ? "/dashboard" : "/portal/attendance");
              }}
            >
              {path.startsWith("/portal") ? "Shop view" : "Mechanic view"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void resetSandboxShop()}>
              Reset sample shop
            </Button>
            <form action="/api/sandbox/exit" method="post">
              <Button type="submit" size="sm" variant="outline">
                Exit
              </Button>
            </form>
          </div>
        </div>
        {path.startsWith("/portal") ? (
          <div className="min-h-screen bg-slate-50 px-4 pb-5 pt-3 md:pb-6 md:pt-4">
            <div className="mx-auto max-w-[30rem] space-y-3 pb-5 md:space-y-4 md:pb-6">
              <MechanicPortalClientGuard />
              <MechanicPortalDeviceBootstrap />
              <MechanicPortalHeaderCard
                displayName={mechanicName}
                businessName={snapshot.business.name}
                businessMarkUrl={snapshot.business.markDataUrl ?? "/tenants/_default/mark-wl2.png"}
              />
              {children}
            </div>
          </div>
        ) : (
        <AppShell
          navigationItems={navigationItems}
          userDisplayName={owner ? `${owner.firstName} ${owner.lastName}` : "Owner"}
          userRoleLabel={ROLE_LABEL}
          capabilities={getRoleCapabilities("owner")}
          businessName={snapshot.business.name}
          businessLogoUrl={snapshot.business.logoDataUrl}
          businessMarkUrl={snapshot.business.markDataUrl ?? "/tenants/_default/mark-wl2.png"}
        >
          {children}
        </AppShell>
        )}
      </div>
    </SandboxModeProvider>
  );
}
