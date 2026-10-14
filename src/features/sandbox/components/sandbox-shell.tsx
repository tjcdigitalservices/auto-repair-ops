"use client";

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";

import { AppShell } from "@/components/shared/app-shell";
import { Button } from "@/components/ui/button";
import { getRoleCapabilities } from "@/lib/auth/permissions";
import { DASHBOARD_NAV_ITEMS } from "@/lib/navigation";
import { readSandboxShop, resetSandboxShop, subscribeSandboxShop, loadSandboxShop } from "@/features/sandbox/store";
import { SandboxModeProvider } from "@/features/sandbox/use-bound-action";

const ROLE_LABEL = "Owner";

export function SandboxShell({ children }: { children: React.ReactNode }) {
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

  const navigationItems = DASHBOARD_NAV_ITEMS.filter((item) =>
    (item.requiredCapabilities ?? [item.capability]).every((capability) =>
      getRoleCapabilities("owner").includes(capability),
    ),
  ).map(({ capability: _capability, requiredCapabilities: _requiredCapabilities, ...item }) => item);

  return (
    <SandboxModeProvider>
      <div className="min-h-svh bg-slate-50">
        <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
          <p>Sandbox — saved only in this browser.</p>
          <div className="flex items-center gap-2">
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
        <AppShell
          navigationItems={navigationItems}
          userDisplayName="Sandbox Owner"
          userRoleLabel={ROLE_LABEL}
          capabilities={getRoleCapabilities("owner")}
          businessName={snapshot.business.name}
          businessLogoUrl={snapshot.business.logoDataUrl}
          businessMarkUrl={snapshot.business.markDataUrl ?? "/tenants/_default/mark-wl2.png"}
        >
          {children}
        </AppShell>
      </div>
    </SandboxModeProvider>
  );
}
