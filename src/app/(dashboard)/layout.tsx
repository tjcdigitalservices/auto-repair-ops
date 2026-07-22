import { AppShell } from "@/components/shared/app-shell";
import { DASHBOARD_NAV_ITEMS } from "@/lib/navigation";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { getBranchScope } from "@/lib/branches";
import { getTenantBrandingById } from "@/lib/branding";
import { getBusinessBranding } from "@/features/settings/queries/settings-queries";

const SHOW_SIDEBAR_BUSINESS_NAME = false;

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Administrator",
  mechanic: "Mechanic",
  cashier: "Cashier",
  inventory_staff: "Inventory Staff",
  service_advisor: "Service Advisor",
} as const;

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [context, branchScope] = await Promise.all([
    requireAuthenticatedStaff(),
    getBranchScope(),
  ]);
  const branchId = branchScope.selectedBranchId ?? branchScope.currentUserBranchId;
  const [branding, tenantBranding] = await Promise.all([
    getBusinessBranding(branchId),
    getTenantBrandingById(context.tenantId),
  ]);
  const businessMarkUrl = branding.businessMarkUrl ?? tenantBranding.markSrc;
  const navigationItems = DASHBOARD_NAV_ITEMS.filter((item) =>
    (item.requiredCapabilities ?? [item.capability]).every((capability) =>
      context.capabilities.includes(capability),
    ),
  ).map(({ capability: _capability, requiredCapabilities: _requiredCapabilities, ...item }) => item);

  return (
    <AppShell
      navigationItems={navigationItems}
      userDisplayName={context.displayName}
      userRoleLabel={ROLE_LABELS[context.role]}
      capabilities={context.capabilities}
      businessName={branding.businessName}
      businessLogoUrl={branding.businessLogoUrl}
      businessMarkUrl={businessMarkUrl}
      showSidebarBusinessName={SHOW_SIDEBAR_BUSINESS_NAME}
    >
      {children}
    </AppShell>
  );
}
