import { PrintDocumentPage } from "@/components/reports/print-document-page";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { ReportSectionHeading } from "@/components/reports/report-section-heading";
import { ReportTotals } from "@/components/reports/report-totals";
import type { RemittancePrintDocument } from "@/features/payroll/types";
import { formatPayrollCoverage } from "@/features/payroll/utils";
import { formatPrintCurrency } from "@/lib/currency";
import { formatDateTime, formatDocumentDate } from "@/lib/dates";

const FIRST_PAGE_ROW_COUNT = 12;
const FOLLOWING_PAGE_ROW_COUNT = 16;

export function RemittancePrintLayout({
  document,
}: {
  document: RemittancePrintDocument;
}) {
  const pages = buildRemittancePages(document.employees);

  return (
    <PrintPageStack className="leading-[1.35]">
      {pages.map((page, index) => (
        <PrintDocumentPage
          key={page.key}
          businessProfile={document.businessProfile}
          documentTitle="Remittance Summary"
          documentMeta={`${document.monthLabel} · Page ${index + 1} of ${pages.length}`}
          compactHeader={index > 0}
          className="leading-[1.35]"
          bodyClassName="pb-[8mm]"
        >
          {page.includeOverview ? (
            <section className="report-section-keep mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.35fr)_250px]">
              <div className="space-y-3">
                <div>
                  <ReportSectionHeading title="REMITTANCE MONTH" />
                  <div className="grid gap-x-5 gap-y-2 text-[10.75px] sm:grid-cols-2">
                    <MetadataRow label="Month" value={document.monthLabel} />
                    <MetadataRow
                      label="Coverage window"
                      value={formatPayrollCoverage(document.monthStartDate, document.monthEndDate)}
                    />
                    <MetadataRow label="Generated" value={formatDateTime(document.generatedAt)} />
                    <MetadataRow
                      label="Source"
                      value="Finalized payroll · employee share only"
                    />
                  </div>
                </div>

                <div>
                  <ReportSectionHeading title="INCLUDED FINALIZED PERIODS" />
                  {document.includedPeriods.length === 0 ? (
                    <p className="text-[10.5px] text-slate-600">No finalized periods in this month.</p>
                  ) : (
                    <ul className="space-y-1 text-[10.5px] text-slate-700">
                      {document.includedPeriods.map((period) => (
                        <li key={period.id}>
                          <span className="font-medium">{period.label}</span>
                          {" · "}
                          {formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}
                          {" · payout "}
                          {formatDocumentDate(period.payoutDate)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <ReportSectionHeading title="EE TOTALS" />
                <div className="rounded-sm border border-brand-border bg-brand-soft/30 px-3 py-3">
                  <ReportTotals
                    lines={[
                      { label: "SSS:", value: formatPrintCurrency(document.totals.sssAmount) },
                      {
                        label: "PhilHealth:",
                        value: formatPrintCurrency(document.totals.philhealthAmount),
                      },
                      {
                        label: "Pag-IBIG:",
                        value: formatPrintCurrency(document.totals.pagibigAmount),
                      },
                      {
                        label: "Total EE:",
                        value: formatPrintCurrency(document.totals.totalAmount),
                        emphasized: true,
                      },
                    ]}
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-5">
            <ReportSectionHeading title="EMPLOYEE REMITTANCE" />
            {page.rows.length === 0 ? (
              <p className="mt-2 text-[10.5px] text-slate-600">
                No SSS, PhilHealth, or Pag-IBIG employee deductions for this month.
              </p>
            ) : (
              <table className="mt-1 w-full border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="px-1.5 py-1.5 font-semibold">Employee</th>
                    <th className="px-1.5 py-1.5 font-semibold">SSS No.</th>
                    <th className="px-1.5 py-1.5 font-semibold">PhilHealth No.</th>
                    <th className="px-1.5 py-1.5 font-semibold">Pag-IBIG No.</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">SSS</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">PhilHealth</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">Pag-IBIG</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((employee) => (
                    <tr key={employee.staffId} className="border-b border-slate-100 align-top">
                      <td className="px-1.5 py-1.5 font-medium text-slate-900">{employee.fullName}</td>
                      <td className="px-1.5 py-1.5 tabular-nums text-slate-700">
                        {employee.sssNumber?.trim() || "—"}
                      </td>
                      <td className="px-1.5 py-1.5 tabular-nums text-slate-700">
                        {employee.philhealthNumber?.trim() || "—"}
                      </td>
                      <td className="px-1.5 py-1.5 tabular-nums text-slate-700">
                        {employee.pagibigNumber?.trim() || "—"}
                      </td>
                      <td className="px-1.5 py-1.5 text-right tabular-nums">
                        {formatPrintCurrency(employee.sssAmount)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right tabular-nums">
                        {formatPrintCurrency(employee.philhealthAmount)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right tabular-nums">
                        {formatPrintCurrency(employee.pagibigAmount)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-medium tabular-nums">
                        {formatPrintCurrency(employee.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  {page.includeTotals ? (
                    <tr className="border-t border-slate-300 font-semibold">
                      <td className="px-1.5 py-1.5" colSpan={4}>
                        Totals
                      </td>
                      <td className="px-1.5 py-1.5 text-right tabular-nums">
                        {formatPrintCurrency(document.totals.sssAmount)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right tabular-nums">
                        {formatPrintCurrency(document.totals.philhealthAmount)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right tabular-nums">
                        {formatPrintCurrency(document.totals.pagibigAmount)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right tabular-nums">
                        {formatPrintCurrency(document.totals.totalAmount)}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </section>
        </PrintDocumentPage>
      ))}
    </PrintPageStack>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-[10.75px] text-slate-800">{value}</dd>
    </div>
  );
}

function buildRemittancePages(employees: RemittancePrintDocument["employees"]) {
  if (employees.length === 0) {
    return [
      {
        key: "empty",
        includeOverview: true,
        includeTotals: true,
        rows: [] as RemittancePrintDocument["employees"],
      },
    ];
  }

  const pages: Array<{
    key: string;
    includeOverview: boolean;
    includeTotals: boolean;
    rows: RemittancePrintDocument["employees"];
  }> = [];

  let cursor = 0;
  let pageIndex = 0;

  while (cursor < employees.length) {
    const isFirstPage = pageIndex === 0;
    const capacity = isFirstPage ? FIRST_PAGE_ROW_COUNT : FOLLOWING_PAGE_ROW_COUNT;
    const rows = employees.slice(cursor, cursor + capacity);
    cursor += rows.length;
    const isLastPage = cursor >= employees.length;

    pages.push({
      key: `page-${pageIndex + 1}`,
      includeOverview: isFirstPage,
      includeTotals: isLastPage,
      rows,
    });
    pageIndex += 1;
  }

  return pages;
}
