import { RemittancePrintLayout } from "@/components/reports/remittance-print-layout";
import { ReportAutoPrint } from "@/components/reports/report-auto-print";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getRemittancePrintDocument } from "@/features/payroll/queries/payroll-remittance-queries";

export const dynamic = "force-dynamic";

type RemittancePrintPageProps = {
  searchParams?: Promise<{
    month?: string;
    autoprint?: string;
  }>;
};

export default async function RemittancePrintPage({ searchParams }: RemittancePrintPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const document = await getRemittancePrintDocument(resolvedSearchParams?.month);
  const autoPrint = resolvedSearchParams?.autoprint === "1";

  return (
    <ReportPage wrapInPrintPage={false} toolbar={<ReportToolbar />}>
      <ReportAutoPrint enabled={autoPrint} />
      <RemittancePrintLayout document={document} />
    </ReportPage>
  );
}
