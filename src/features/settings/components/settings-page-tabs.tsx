"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BranchesBrandingPanel } from "@/features/settings/components/branches-branding-panel";
import { BusinessProfileForm } from "@/features/settings/components/business-profile-form";
import { DocumentSequenceForm } from "@/features/settings/components/document-sequence-form";
import { OperationalRulesForm } from "@/features/settings/components/operational-rules-form";
import { PublicPresenceForm } from "@/features/settings/components/public-presence-form";
import { ThemeColorsForm } from "@/features/settings/components/theme-colors-form";
import type { SettingsPageTab, SettingsTabPageData } from "@/features/settings/types";
import { SETTINGS_PAGE_TAB_OPTIONS } from "@/features/settings/utils";

export function SettingsPageTabs({
  activeTab,
  data,
}: {
  activeTab: SettingsPageTab;
  data: SettingsTabPageData;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateTab(nextTab: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Tabs
      defaultValue="profile"
      value={activeTab}
      onValueChange={updateTab}
      className="min-w-0 space-y-0"
    >
      <TabsList>
        {SETTINGS_PAGE_TAB_OPTIONS.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={activeTab} className="space-y-6">
        <SettingsTabPanel data={data} />
      </TabsContent>
    </Tabs>
  );
}

function SettingsTabPanel({ data }: { data: SettingsTabPageData }) {
  switch (data.tab) {
    case "profile":
      return <BusinessProfileForm initialValues={data.settings} />;
    case "branches":
      return (
        <BranchesBrandingPanel
          branches={data.branches}
          selectedBranchId={data.selectedBranchId}
          canSwitch={data.canSwitch}
          canManageBranches={data.canManageBranches}
          canEditTenantBranding={data.canEditTenantBranding}
          branding={data.branding}
        />
      );
    case "operations":
      return <OperationalRulesForm initialValues={data.settings} />;
    case "theme":
      return <ThemeColorsForm themePalette={data.themePalette} />;
    case "presence":
      return <PublicPresenceForm initialValues={data.publicPresence} />;
    case "documents":
      if (data.documentSequences.length === 0) {
        return (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
            Document number sequences are not configured for this branch yet.
            Refresh the page to initialize defaults, or contact an owner/admin.
          </div>
        );
      }

      return (
        <div className="grid gap-6 xl:grid-cols-2">
          {data.documentSequences.map((sequence) => (
            <DocumentSequenceForm key={sequence.key} sequence={sequence} />
          ))}
        </div>
      );
  }
}
