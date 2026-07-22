import { notFound } from "next/navigation";

import { PaymentDetailPageContent } from "@/features/invoices/components/payment-detail-page-content";
import { getPaymentById } from "@/features/invoices/queries/invoice-queries";

export const dynamic = "force-dynamic";

type PaymentDetailPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { paymentId } = await params;
  const payment = await getPaymentById(paymentId);

  if (!payment) {
    notFound();
  }

  return <PaymentDetailPageContent payment={payment} />;
}
