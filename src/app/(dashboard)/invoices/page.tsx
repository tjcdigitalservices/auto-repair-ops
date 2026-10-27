import { InvoicesPageView } from "@/features/invoices/components/invoices-page-view";
import type { InvoiceStatus } from "@/features/invoices/types";
import { listInvoices } from "@/features/invoices/queries/invoice-queries";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

type InvoicesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: InvoiceStatus;
    page?: string;
  }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const [{ search = "", status = "", page }, branchSelector] = await Promise.all([
    searchParams,
    getBranchScope().then(getPageBranchSelectorProps),
  ]);
  const invoices = await listInvoices({ search, status });

  return (
    <InvoicesPageView
      invoices={invoices}
      search={search}
      status={status}
      page={page}
      branchSelector={branchSelector}
    />
  );
}
