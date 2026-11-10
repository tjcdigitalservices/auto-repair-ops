import { notFound } from "next/navigation";

import { QuotationPrintLayout } from "@/components/reports/quotation-print-layout";
import { QuotationPrintToolbar } from "@/components/reports/quotation-print-toolbar";
import { ReportPage } from "@/components/reports/report-page";
import { resolveQuotationPrintMode } from "@/features/quotations/report-utils";
import { getQuotationPrintDocument } from "@/features/quotations/queries/quotation-print-queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuotationPrintPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
  searchParams: Promise<{
    mode?: string;
  }>;
};

export default async function QuotationPrintPage({
  params,
  searchParams,
}: QuotationPrintPageProps) {
  const { quotationId } = await params;
  const { mode: requestedMode } = await searchParams;
  const mode = resolveQuotationPrintMode(requestedMode);
  const document = await getQuotationPrintDocument(quotationId);

  if (!document) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: staff } = user
    ? await supabase
        .from("staff")
        .select("id")
        .eq("linked_user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  return (
    <ReportPage
      wrapInPrintPage={false}
      toolbar={
        <QuotationPrintToolbar
          quotationId={document.quotation.id}
          mode={mode}
          showDownload={Boolean(staff)}
        />
      }
    >
      <QuotationPrintLayout document={document} mode={mode} />
    </ReportPage>
  );
}
