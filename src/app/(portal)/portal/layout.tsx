import { redirect } from "next/navigation";

import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { getTenantBrandingById } from "@/lib/branding";
import { MechanicPortalClientGuard } from "@/features/attendance/components/mechanic-portal-client-guard";
import { MechanicPortalDeviceBootstrap } from "@/features/attendance/components/mechanic-portal-device-bootstrap";
import { MechanicPortalHeaderCard } from "@/features/attendance/components/mechanic-portal-header-card";

export default async function MechanicPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireAuthenticatedStaff();

  if (context.role !== "mechanic") {
    redirect("/dashboard");
  }

  const tenantBranding = await getTenantBrandingById(context.tenantId);

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-5 pt-3 md:pb-6 md:pt-4">
      <div className="mx-auto max-w-[30rem] space-y-3 pb-5 md:space-y-4 md:pb-6">
        <MechanicPortalClientGuard />
        <MechanicPortalDeviceBootstrap />
        <MechanicPortalHeaderCard
          displayName={context.displayName}
          businessName={tenantBranding.companyName}
          businessMarkUrl={tenantBranding.markSrc}
        />

        {children}
      </div>
    </div>
  );
}
