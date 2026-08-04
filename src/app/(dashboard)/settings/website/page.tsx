import { WebsiteWorkspacePageContent } from "@/features/website/components/website-workspace-page-content";
import { getWebsiteWorkspaceData } from "@/features/website/queries/website-queries";

export const dynamic = "force-dynamic";

export default async function WebsiteSettingsPage() {
  const data = await getWebsiteWorkspaceData();

  return <WebsiteWorkspacePageContent data={data} />;
}
