import { PageHeader } from "@/components/shared/page-header";
import { SettingsPageTabs } from "@/features/settings/components/settings-page-tabs";
import { getSettingsTabPageData } from "@/features/settings/queries/settings-queries";
import { resolveSettingsPageTab } from "@/features/settings/utils";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const activeTab = resolveSettingsPageTab((await searchParams).tab);
  const settingsTab = await getSettingsTabPageData(activeTab);

  return (
    <div className="space-y-0">
      <PageHeader
        title="Settings"
        description="Business identity and operational billing behavior."
      />

      <SettingsPageTabs activeTab={activeTab} data={settingsTab} />
    </div>
  );
}
