import { JobOrdersPageView } from "@/features/job-orders/components/job-orders-page-view";
import { listJobOrders } from "@/features/job-orders/queries/job-order-queries";
import type { JobOrderStatus } from "@/features/job-orders/types";
import { canDeleteJobOrdersByRole, getSimplifiedJobOrderStatus } from "@/features/job-orders/utils";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

type JobOrdersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: JobOrderStatus | "active" | "";
    page?: string;
    error?: string;
  }>;
};

export default async function JobOrdersPage({ searchParams }: JobOrdersPageProps) {
  const { search = "", status: rawStatus = "", page, error } = await searchParams;
  const status =
    rawStatus === "active"
      ? "active"
      : rawStatus
        ? getSimplifiedJobOrderStatus(rawStatus)
        : "";
  const [jobOrders, session, branchSelector] = await Promise.all([
    listJobOrders({ search, status }),
    requireAuthenticatedStaff(),
    getBranchScope().then(getPageBranchSelectorProps),
  ]);

  return (
    <JobOrdersPageView
      jobOrders={jobOrders}
      search={search}
      status={status}
      page={page}
      error={error}
      canDeleteJobOrders={canDeleteJobOrdersByRole(session.role)}
      branchSelector={branchSelector}
    />
  );
}
