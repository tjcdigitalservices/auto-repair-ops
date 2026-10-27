import { PaymentsPageView } from "@/features/invoices/components/payments-page-view";
import type { PaymentMethod } from "@/features/invoices/types";
import { listPayments } from "@/features/invoices/queries/invoice-queries";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

type PaymentsPageProps = {
  searchParams: Promise<{
    search?: string;
    paymentMethod?: PaymentMethod | "";
    page?: string;
  }>;
};

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const [{ search = "", paymentMethod = "", page }, branchSelector] = await Promise.all([
    searchParams,
    getBranchScope().then(getPageBranchSelectorProps),
  ]);
  const payments = await listPayments({ search, paymentMethod });

  return (
    <PaymentsPageView
      payments={payments}
      search={search}
      paymentMethod={paymentMethod}
      page={page}
      branchSelector={branchSelector}
    />
  );
}
