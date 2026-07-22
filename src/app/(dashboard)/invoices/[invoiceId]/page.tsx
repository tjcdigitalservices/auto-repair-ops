import { notFound } from "next/navigation";

import { InvoiceDetailPageContent } from "@/features/invoices/components/invoice-detail-page-content";
import { getInvoiceById } from "@/features/invoices/queries/invoice-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type InvoiceDetailPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const viewer = await requireAuthenticatedStaff();
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  const canCancel =
    (viewer.role === "owner" || viewer.role === "admin") && invoice.canCancel;

  return <InvoiceDetailPageContent invoice={invoice} canCancel={canCancel} />;
}
