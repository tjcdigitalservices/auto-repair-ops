import { notFound } from "next/navigation";

import { getJobOrderById } from "@/features/job-orders/queries/job-order-queries";
import { QuotationDetailPageContent } from "@/features/quotations/components/quotation-detail-page-content";
import type { QuotationRelatedDocument } from "@/features/quotations/components/quotation-related-documents-tab";
import { getQuotationById } from "@/features/quotations/queries/quotation-queries";
import { canDeleteQuotation, canReviseQuotation } from "@/features/quotations/utils";

export const dynamic = "force-dynamic";

type QuotationDetailPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { quotationId } = await params;
  const quotation = await getQuotationById(quotationId);

  if (!quotation) {
    notFound();
  }

  const canApprove = quotation.status === "draft" || quotation.status === "pending_approval";
  const canEdit = quotation.status !== "approved";
  const jobOrder =
    quotation.jobOrderId ? await getJobOrderById(quotation.jobOrderId) : null;
  const canRevise = canReviseQuotation({
    status: quotation.status,
    jobOrderId: quotation.jobOrderId,
    jobOrderStatus: jobOrder?.status ?? null,
    hasActiveInvoice:
      Boolean(jobOrder?.invoiceId) && jobOrder?.invoiceStatus !== "cancelled",
  });
  const canDelete = canDeleteQuotation(quotation.status) && !quotation.jobOrderId;

  const relatedDocuments = buildRelatedDocuments(quotation, jobOrder);

  return (
    <QuotationDetailPageContent
      quotation={quotation}
      relatedDocuments={relatedDocuments}
      canEdit={canEdit}
      canApprove={canApprove}
      canRevise={canRevise}
      canDelete={canDelete}
    />
  );
}

function buildRelatedDocuments(
  quotation: NonNullable<Awaited<ReturnType<typeof getQuotationById>>>,
  jobOrder: Awaited<ReturnType<typeof getJobOrderById>>,
): QuotationRelatedDocument[] {
  const documents: QuotationRelatedDocument[] = [];

  if (quotation.jobOrderId && quotation.jobOrderNumber && jobOrder) {
    documents.push({
      id: quotation.jobOrderId,
      documentType: "job_order",
      documentLabel: quotation.jobOrderNumber,
      documentHref: `/job-orders/${quotation.jobOrderId}`,
      status: jobOrder.status,
      occurredAt: jobOrder.createdAt,
    });

    if (jobOrder.invoiceId && jobOrder.invoiceNumber && jobOrder.invoiceStatus) {
      documents.push({
        id: jobOrder.invoiceId,
        documentType: "invoice",
        documentLabel: jobOrder.invoiceNumber,
        documentHref: `/invoices/${jobOrder.invoiceId}`,
        status: jobOrder.invoiceStatus,
        occurredAt: jobOrder.createdAt,
      });
    }
  }

  return documents;
}
