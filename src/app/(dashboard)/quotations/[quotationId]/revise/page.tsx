import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { QuotationForm } from "@/features/quotations/components/quotation-form";
import { getQuotationReviseContext } from "@/features/quotations/queries/quotation-revise-queries";
import { getQuotationFormOptions } from "@/features/quotations/queries/quotation-queries";

export const dynamic = "force-dynamic";

type ReviseQuotationPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function ReviseQuotationPage({ params }: ReviseQuotationPageProps) {
  const { quotationId } = await params;
  const [reviseContext, options] = await Promise.all([
    getQuotationReviseContext(quotationId),
    getQuotationFormOptions(),
  ]);

  if (!reviseContext) {
    notFound();
  }

  if (!reviseContext.canRevise) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Revise ${reviseContext.quotation.quotationNumber}`}
          description="This approved quotation cannot be revised in its current state."
        />
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          {reviseContext.blockReason ?? "Revise is not available for this quotation."}
        </div>
        <Button asChild variant="outline">
          <Link href={`/quotations/${quotationId}`}>Back to quotation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/quotations/${quotationId}`}
        backLabel="Back to quotation"
        title={`Revise ${reviseContext.quotation.quotationNumber}`}
        description={
          <div className="space-y-1.5">
            <p>
              {reviseContext.quotation.customerName} · {reviseContext.quotation.vehicleLabel}
            </p>
            <p className="pt-1">
              The linked job order is the operational source of truth. Saving synchronizes line
              items, prices, and totals with the customer-facing quotation.
            </p>
          </div>
        }
      />
      <QuotationForm mode="revise" options={options} initialValues={reviseContext.initialValues} />
    </div>
  );
}
