import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { QuotationForm } from "@/features/quotations/components/quotation-form";
import { mapQuotationDetailToFormValues } from "@/features/quotations/mappers";
import { getQuotationById, getQuotationFormOptions } from "@/features/quotations/queries/quotation-queries";

export const dynamic = "force-dynamic";

type EditQuotationPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function EditQuotationPage({ params }: EditQuotationPageProps) {
  const { quotationId } = await params;
  const [quotation, options] = await Promise.all([
    getQuotationById(quotationId),
    getQuotationFormOptions(),
  ]);

  if (!quotation || quotation.status === "approved") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/quotations/${quotationId}`}
        backLabel="Back to quotation"
        title="Edit Quotation"
        description={
          <div className="space-y-1.5">
            <p className="font-medium text-foreground">{quotation.quotationNumber}</p>
            <p>
              {quotation.customerName} · {quotation.vehicleLabel}
            </p>
            <p className="pt-1">Update this draft quotation before approval.</p>
          </div>
        }
      />
      <QuotationForm
        mode="edit"
        options={options}
        initialValues={mapQuotationDetailToFormValues(quotation)}
      />
    </div>
  );
}
