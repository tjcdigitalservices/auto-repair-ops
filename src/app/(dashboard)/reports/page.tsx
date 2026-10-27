import { ReportsPageView } from "@/features/reports/components/reports-page-view";
import { getReportsPageData } from "@/features/reports/queries/report-queries";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    groupBy?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const [reports, branchSelector] = await Promise.all([
    getReportsPageData(resolvedSearchParams),
    getBranchScope().then(getPageBranchSelectorProps),
  ]);

  return <ReportsPageView reports={reports} branchSelector={branchSelector} />;
}
