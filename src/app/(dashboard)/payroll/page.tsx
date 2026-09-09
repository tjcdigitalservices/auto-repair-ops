import { PayrollPageContent } from "@/features/payroll/components/payroll-page-content";
import type { PayrollPageTab } from "@/features/payroll/components/payroll-tab-nav";
import { getPayrollPageData } from "@/features/payroll/queries/payroll-queries";
import { getRemittanceSummaryData } from "@/features/payroll/queries/payroll-remittance-queries";
import { resolvePayrollPageFilters } from "@/features/payroll/utils";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

type PayrollPageProps = {
  searchParams: Promise<{
    tab?: "compensation" | "remittance";
    month?: string;
    periodSearch?: string;
    staffSearch?: string;
    staffFilter?: string;
    periodStatus?: string;
    periodPage?: string;
    staffPage?: string;
  }>;
};

function resolveActiveTab(tab?: string): PayrollPageTab {
  if (tab === "compensation") {
    return "compensation";
  }

  if (tab === "remittance") {
    return "remittance";
  }

  return "periods";
}

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const resolvedSearchParams = await searchParams;
  const activeTab = resolveActiveTab(resolvedSearchParams.tab);
  const filters = resolvePayrollPageFilters(resolvedSearchParams);

  const [data, remittanceData, branchSelector] = await Promise.all([
    getPayrollPageData(filters),
    activeTab === "remittance"
      ? getRemittanceSummaryData(resolvedSearchParams.month)
      : Promise.resolve(undefined),
    getBranchScope().then(getPageBranchSelectorProps),
  ]);

  return (
    <PayrollPageContent
      data={data}
      remittanceData={remittanceData}
      activeTab={activeTab}
      periodPage={resolvedSearchParams.periodPage}
      staffPage={resolvedSearchParams.staffPage}
      branchSelector={branchSelector}
    />
  );
}
