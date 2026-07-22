import { PayrollPageContent } from "@/features/payroll/components/payroll-page-content";
import { getPayrollPageData } from "@/features/payroll/queries/payroll-queries";
import { resolvePayrollPageFilters } from "@/features/payroll/utils";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

type PayrollPageProps = {
  searchParams: Promise<{
    tab?: "compensation";
    periodSearch?: string;
    staffSearch?: string;
    staffFilter?: string;
    periodStatus?: string;
    periodPage?: string;
    staffPage?: string;
  }>;
};

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab === "compensation" ? "compensation" : "periods";
  const filters = resolvePayrollPageFilters(resolvedSearchParams);
  const [data, branchSelector] = await Promise.all([
    getPayrollPageData(filters),
    getBranchScope().then(getPageBranchSelectorProps),
  ]);

  return (
    <PayrollPageContent
      data={data}
      activeTab={activeTab}
      periodPage={resolvedSearchParams.periodPage}
      staffPage={resolvedSearchParams.staffPage}
      branchSelector={branchSelector}
    />
  );
}
