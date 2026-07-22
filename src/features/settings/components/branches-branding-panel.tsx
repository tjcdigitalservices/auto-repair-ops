import { SectionCard } from "@/components/shared/section-card";
import { BranchSwitcher } from "@/features/settings/components/branch-switcher";
import { CreateBranchForm } from "@/features/settings/components/create-branch-form";
import { TenantBrandingForm } from "@/features/settings/components/tenant-branding-form";
import type { ResolvedTenantBranding } from "@/lib/branding/types";

export type BranchesBrandingPanelBranch = {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
};

export function BranchesBrandingPanel({
  branches,
  selectedBranchId,
  canSwitch,
  canManageBranches,
  canEditTenantBranding,
  branding,
}: {
  branches: BranchesBrandingPanelBranch[];
  selectedBranchId: string;
  canSwitch: boolean;
  canManageBranches: boolean;
  canEditTenantBranding: boolean;
  branding: ResolvedTenantBranding;
}) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Active branch"
        description="Choose which branch ops screens write to (owners can switch freely)."
      >
        <div className="space-y-6">
          <BranchSwitcher
            branches={branches.map((branch) => ({
              id: branch.id,
              name: branch.name,
              code: branch.code,
            }))}
            selectedBranchId={selectedBranchId}
            canSwitch={canSwitch}
          />

          <ul className="divide-y divide-border/70">
            {branches.map((branch) => (
              <li
                key={branch.id}
                className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-foreground">{branch.name}</p>
                  <p className="text-muted-foreground">{branch.code}</p>
                </div>
                <p className="text-muted-foreground">{branch.isMain ? "Main" : "Branch"}</p>
              </li>
            ))}
          </ul>

          {canManageBranches ? (
            <div className="border-t border-border/70 pt-6">
              <h3 className="text-sm font-semibold text-foreground">Add branch</h3>
              <div className="mt-4">
                <CreateBranchForm />
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      {canEditTenantBranding ? (
        <SectionCard
          title="Tenant branding"
          description="Colors use HSL components without hsl() wrappers (e.g. 225 75% 17%). Asset paths are public URLs such as /tenants/acme/logo.png."
        >
          <TenantBrandingForm branding={branding} />
        </SectionCard>
      ) : null}
    </div>
  );
}
