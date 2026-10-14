import { QuotationsPageView } from "@/features/quotations/components/quotations-page-view";
import { listQuotations } from "@/features/quotations/queries/quotation-queries";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

type QuotationsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "pending" | "draft" | "pending_approval" | "approved" | "rejected" | "expired";
    page?: string;
  }>;
};

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const [{ search = "", status = "", page }, branchSelector] = await Promise.all([
    searchParams,
    getBranchScope().then(getPageBranchSelectorProps),
  ]);
  const quotations = await listQuotations({ search, status });
  const branch = branchSelector.branches.find((item) => item.id === branchSelector.selectedBranchId) ?? branchSelector.branches[0];

  if (!branch) {
    return (
      <QuotationsPageView
        quotations={quotations}
        search={search}
        status={status}
        page={page}
        branch={{ id: "", name: "Workshop", code: "MAIN" }}
      />
    );
  }

  return (
    <QuotationsPageView
      quotations={quotations}
      search={search}
      status={status}
      page={page}
      branch={branch}
    />
  );
}
