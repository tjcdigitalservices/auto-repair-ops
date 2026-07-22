import { notFound } from "next/navigation";

import { ReportAutoPrint } from "@/components/reports/report-auto-print";
import { JobOrderPrintLayout } from "@/components/reports/job-order-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getJobOrderPrintDocument } from "@/features/job-orders/queries/job-order-print-queries";
import { resolveJobOrderPrintHidePrices } from "@/features/job-orders/print-utils";

export const dynamic = "force-dynamic";

type JobOrderPrintPageProps = {
  params: Promise<{
    jobOrderId: string;
  }>;
  searchParams?: Promise<{
    hidePrices?: string;
    showPrices?: string;
    autoprint?: string;
  }>;
};

export default async function JobOrderPrintPage({
  params,
  searchParams,
}: JobOrderPrintPageProps) {
  const { jobOrderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const document = await getJobOrderPrintDocument(jobOrderId);
  const hidePrices = resolveJobOrderPrintHidePrices(resolvedSearchParams);
  const autoPrint = resolvedSearchParams?.autoprint === "1";

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      wrapInPrintPage={false}
      toolbar={
        <ReportToolbar
          downloadHref={`/api/job-orders/${document.jobOrder.id}/pdf${hidePrices ? "" : "?showPrices=1"}`}
          alternatePrintHref={`/job-orders/${document.jobOrder.id}/print${hidePrices ? "?showPrices=1" : ""}`}
          showingAlternatePrint={hidePrices}
          alternatePrintLabel="Print with Prices"
          primaryPrintLabel="Print Job Order"
        />
      }
    >
      <ReportAutoPrint enabled={autoPrint} />
      <JobOrderPrintLayout document={document} hidePrices={hidePrices} />
    </ReportPage>
  );
}
