import { PrintDocumentPage } from "@/components/reports/print-document-page";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import type {
  InvoiceItemDetail,
  InvoicePaymentEntry,
  InvoicePrintDocument,
  InvoicePrintJobOrderSnapshot,
} from "@/features/invoices/types";
import {
  formatPaymentMethod,
} from "@/features/invoices/utils";
import {
  formatDocumentPrintCurrency,
  formatDocumentPrintCurrencyNumber,
} from "@/lib/currency";
import { formatDocumentDate, formatDateTime } from "@/lib/dates";

const INVOICE_PAGE_CAPACITY = 17.65;
const INVOICE_CONTINUATION_CAPACITY = 18.1;

type InvoiceLineRow =
  | { kind: "group"; key: string; label: "PARTS" | "LABOR / SERVICES" }
  | {
      kind: "item";
      key: string;
      displayLineNumber: number;
      description: string;
      subtext: string | null;
      quantityLabel: string;
      unitPrice: number;
      amount: number;
    };

type InvoicePrintPageModel = {
  key: string;
  lineRows: InvoiceLineRow[];
  paymentRows: InvoicePaymentEntry[];
  includeIntro: boolean;
  includeClosing: boolean;
};

export function InvoicePrintLayout({
  document,
}: {
  document: InvoicePrintDocument;
}) {
  const { invoice, businessProfile, customerSnapshot, vehicleSnapshot, jobOrderSnapshot } =
    document;
  const lineItems = buildInvoiceLineRows(invoice.items);
  const workSummary = buildWorkSummaryText(jobOrderSnapshot);
  const pages = buildInvoicePrintPages({
    lineItems,
    payments: invoice.payments,
    isCancelled: invoice.status === "cancelled",
    hasWorkSummary: Boolean(workSummary),
  });

  return (
    <PrintPageStack className="invoice-print-document leading-[1.42]">
      {pages.map((page, index) => (
        <PrintDocumentPage
          key={page.key}
          className="invoice-print-page leading-[1.42]"
          bodyClassName="pb-[4mm]"
          compactHeader={index > 0}
          businessProfile={businessProfile}
          documentTitle="Invoice"
          documentMeta={buildCompactHeaderMeta(
            invoice.invoiceNumber,
            invoice.invoiceDate,
          )}
        >
          {page.includeIntro ? (
            <>
              <section className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <InvoiceInfoPanel
                  title="CUSTOMER DETAILS"
                  rows={[
                    { label: "Name", value: invoice.customerName },
                    { label: "Company", value: customerSnapshot.companyName || "—" },
                    {
                      label: "Phone",
                      value: invoice.customerContactNumber || "—",
                    },
                    { label: "Email", value: customerSnapshot.email || "—" },
                    { label: "Address", value: invoice.customerAddress || "—" },
                  ]}
                />
                <InvoiceInfoPanel
                  title="VEHICLE INFORMATION"
                  rows={[
                    { label: "Make / Model", value: formatVehicleModel(invoice) },
                    {
                      label: "Year",
                      value: invoice.vehicleYear ? String(invoice.vehicleYear) : "—",
                    },
                    { label: "Color", value: vehicleSnapshot.color || "—" },
                    { label: "VIN", value: invoice.vehicleVin || "—" },
                    { label: "Mileage", value: formatMileage(vehicleSnapshot.mileage) },
                    {
                      label: "Plate No.",
                      value: invoice.vehiclePlateNumber || "—",
                    },
                  ]}
                />
              </section>

              {invoice.status === "cancelled" ? (
                <section className="report-section-keep mt-3.5">
                  <div className="rounded-[1.25rem] border border-brand-red bg-brand-red/10 px-4 py-3">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-brand-red">
                      Cancelled Invoice
                    </p>
                    <div className="mt-2 grid gap-2 text-[10.5px] text-slate-800 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold">Cancelled at:</span>{" "}
                        {invoice.cancelledAt
                          ? formatDateTime(invoice.cancelledAt)
                          : "Not recorded"}
                      </p>
                      <p>
                        <span className="font-semibold">Reason:</span>{" "}
                        {invoice.cancellationReason || "No reason recorded"}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {page.lineRows.length > 0 ? (
            <InvoiceLineItemsSection rows={page.lineRows} />
          ) : null}

          {page.paymentRows.length > 0 ? (
            <InvoicePaymentsSection payments={page.paymentRows} />
          ) : null}

          {page.includeClosing ? (
            <div className="flex flex-col gap-3 pt-3.5">
              <section className="report-section-keep grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_268px]">
                <div className="space-y-3">
                  {workSummary ? (
                    <InvoiceWorkSummarySection text={workSummary} />
                  ) : null}
                  <InvoiceTermsSection
                    terms={buildDefaultInvoiceTerms(businessProfile.businessName)}
                  />
                </div>
                <InvoiceTotalsPanel invoice={invoice} />
              </section>

              <section className="report-section-keep">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-brand-navy">
                  PAYMENT ACKNOWLEDGMENT
                </p>
                <div className="mt-1.5 h-0.5 w-12 bg-brand-red" />
                <div className="grid items-start gap-x-4 gap-y-2 pt-[7px] sm:grid-cols-[1.1fr_1.2fr_0.9fr]">
                  <div className="text-[10.1px] leading-[1.34] text-slate-700">
                    <p>
                      I acknowledge receipt of the services and/or parts listed above
                      and agree to the invoice terms stated on this document.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <SignatureLine label="Customer Signature" />
                    <SignatureLine label="Name" value={invoice.customerName} />
                    <SignatureLine label="Date" />
                  </div>
                  <div className="border-t border-slate-200 pt-2.5 sm:border-l sm:border-t-0 sm:pl-3.5 sm:pt-0">
                    <PreparedBySignatureBlock
                      name={invoice.preparedByName || "Prepared by current user"}
                      title={invoice.preparedByTitle}
                      businessName={businessProfile.businessName}
                    />
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </PrintDocumentPage>
      ))}
    </PrintPageStack>
  );
}

function InvoiceInfoPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="report-section-keep">
      <div className="flex items-center gap-2.5">
        <span className="bg-brand-navy px-3 py-[5px] text-[10.25px] font-semibold tracking-[0.22em] text-white">
          {title}
        </span>
        <span className="h-px flex-1 bg-brand-border" />
      </div>
      <div className="mt-2.5 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[108px_minmax(0,1fr)] gap-3 text-[10.5px]"
          >
            <p className="font-semibold text-slate-800">{row.label}</p>
            <p className="min-w-0 break-words text-slate-900">
              {row.value || "—"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InvoiceWorkSummarySection({ text }: { text: string }) {
  return (
    <section className="report-section-keep">
      <div className="border border-brand-border">
        <div className="bg-brand-navy px-4 py-2 text-[10.25px] font-semibold tracking-[0.22em] text-white">
          WORK SUMMARY
        </div>
        <div className="px-4 py-3 text-[10.75px] leading-[1.42] whitespace-pre-wrap text-slate-800">
          {text}
        </div>
      </div>
    </section>
  );
}

function InvoiceTermsSection({ terms }: { terms: string[] }) {
  return (
    <section className="report-section-keep">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-brand-navy">
        TERMS &amp; CONDITIONS
      </p>
      <div className="mt-1.5 h-px bg-brand-border" />
      <ul className="mt-[5px] list-disc space-y-[2px] pl-4 text-[9.95px] leading-[1.28] text-slate-700">
        {terms.map((term) => (
          <li key={term}>{term}</li>
        ))}
      </ul>
    </section>
  );
}

function InvoiceLineItemsSection({ rows }: { rows: InvoiceLineRow[] }) {
  return (
    <section className="mt-3.5">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="bg-brand-navy px-3 py-[5px] text-[10.25px] font-semibold tracking-[0.22em] text-white">
          BILLING ITEMS
        </span>
        <span className="h-[2px] flex-1 bg-brand-border" />
      </div>
      <div className="overflow-hidden border border-brand-border">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="w-10 px-3 py-2 text-left font-semibold">#</th>
              <th className="px-3 py-2 text-left font-semibold">Description</th>
              <th className="w-20 px-3 py-2 text-left font-semibold">Qty</th>
              <th className="w-28 px-3 py-2 text-right font-semibold">
                Unit Price
              </th>
              <th className="w-28 px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.kind === "group" ? (
                <tr
                  key={row.key}
                  className="border-t border-slate-200 bg-slate-50"
                >
                  <td
                    colSpan={5}
                    className="border-t border-slate-200 px-3 py-[5px] text-[9.75px] font-semibold uppercase tracking-[0.22em] text-brand-navy"
                  >
                    {row.label}
                  </td>
                </tr>
              ) : (
                <tr
                  key={row.key}
                  className="report-row-avoid border-t border-slate-200"
                >
                  <td className="px-3 py-2.5 align-top text-slate-700">
                    {row.displayLineNumber}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-semibold leading-[1.3] text-slate-950">
                      {row.description}
                    </p>
                    {row.subtext ? (
                      <p className="mt-0.5 text-[9.25px] leading-[1.25] text-slate-600">
                        {row.subtext}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 align-top text-slate-700">
                    {row.quantityLabel}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top text-slate-800">
                    {formatDocumentPrintCurrencyNumber(row.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top font-semibold text-slate-950">
                    {formatDocumentPrintCurrencyNumber(row.amount)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvoicePaymentsSection({
  payments,
}: {
  payments: InvoicePaymentEntry[];
}) {
  return (
    <section className="mt-3.5">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="bg-brand-navy px-3 py-[5px] text-[10.25px] font-semibold tracking-[0.22em] text-white">
          PAYMENTS
        </span>
        <span className="h-[2px] flex-1 bg-brand-border" />
      </div>
      <div className="overflow-hidden border border-brand-border">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="w-24 px-3 py-2 text-left font-semibold">Date</th>
              <th className="w-24 px-3 py-2 text-left font-semibold">Method</th>
              <th className="px-3 py-2 text-left font-semibold">Reference</th>
              <th className="w-28 px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="report-row-avoid border-t border-slate-200"
              >
                <td className="px-3 py-2.5 align-top text-slate-700">
                  {formatDocumentDate(payment.paidAt)}
                </td>
                <td className="px-3 py-2.5 align-top text-slate-700">
                  {formatPaymentMethod(payment.paymentMethod)}
                </td>
                <td className="px-3 py-2.5 align-top text-slate-700">
                  {payment.referenceNumber || "—"}
                </td>
                <td className="px-3 py-2.5 text-right align-top font-semibold text-slate-950">
                  {formatDocumentPrintCurrencyNumber(payment.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvoiceTotalsPanel({
  invoice,
}: {
  invoice: InvoicePrintDocument["invoice"];
}) {
  const paidTotal = invoice.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const totalLines = [
    { label: "Subtotal", value: formatDocumentPrintCurrency(invoice.subtotal) },
    ...(invoice.discount > 0
      ? [
          {
            label: "Discount",
            value: formatDocumentPrintCurrency(invoice.discount),
          },
        ]
      : []),
    ...(invoice.tax > 0
      ? [
          {
            label: "Tax / VAT",
            value: formatDocumentPrintCurrency(invoice.tax),
          },
        ]
      : []),
    { label: "Paid", value: formatDocumentPrintCurrency(paidTotal) },
    {
      label: "Balance",
      value: formatDocumentPrintCurrency(invoice.balance),
    },
  ];

  return (
    <section className="flex h-full flex-col justify-between overflow-hidden border border-brand-border bg-brand-soft/35">
      <div className="flex-1 px-3.5 pt-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-brand-navy">
          INVOICE SUMMARY
        </p>
        <div className="mt-1.5 h-px bg-brand-border" />
        <table className="mt-2 w-full border-collapse text-[10.6px]">
          <tbody>
            {totalLines.map((line) => (
              <tr
                key={line.label}
                className="border-b border-slate-200 last:border-b-0"
              >
                <td className="py-1 pr-4 font-semibold text-slate-700">
                  {line.label}
                </td>
                <td className="py-1 text-right font-semibold text-slate-900">
                  {line.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t-2 border-brand-red bg-brand-navy px-3.5 py-2.25 text-white">
        <div className="flex items-end justify-between gap-4">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.26em]">
            TOTAL INVOICE
          </span>
          <span className="text-[20px] font-semibold leading-none">
            {formatDocumentPrintCurrency(invoice.totalAmount)}
          </span>
        </div>
      </div>
    </section>
  );
}

function SignatureLine({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="grid grid-cols-[118px_minmax(0,150px)] items-center gap-2">
      <p className="text-[10.25px] font-semibold text-slate-700">{label}:</p>
      <div className="border-b border-slate-500 pb-px text-[10.75px] leading-tight text-slate-950">
        {value?.trim() || "\u00A0"}
      </div>
    </div>
  );
}

function PreparedBySignatureBlock({
  name,
  title,
  businessName,
}: {
  name: string;
  title: string | null;
  businessName: string;
}) {
  const subtitle = title || businessName;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10.25px] font-semibold text-slate-700">Prepared By:</p>
      <div className="w-[150px] border-b border-slate-500 pb-px text-[10.75px] leading-tight text-slate-950">
        {"\u00A0"}
      </div>
      <p className="text-[10.75px] leading-tight text-slate-950">{name}</p>
      <p className="text-[10.25px] leading-tight text-slate-600">{subtitle}</p>
    </div>
  );
}

function buildCompactHeaderMeta(invoiceNumber: string, invoiceDate: string) {
  return `Invoice #: ${invoiceNumber} • Date: ${formatDocumentDate(invoiceDate)}`;
}

function buildDefaultInvoiceTerms(businessName: string) {
  return [
    "Payment is due upon release unless otherwise agreed.",
    "Prices include parts and labor as listed unless noted.",
    "Parts and services are warranted for 30 days or 1,000 km, whichever comes first.",
    "Additional work discovered during service may require a revised quotation or invoice.",
    `Thank you for choosing ${businessName}.`,
  ];
}

function buildWorkSummaryText(
  jobOrderSnapshot: InvoicePrintJobOrderSnapshot | null,
) {
  if (!jobOrderSnapshot) {
    return null;
  }

  const sections = [
    getPrintableText(jobOrderSnapshot.customerConcern, "Customer concern"),
    getPrintableText(jobOrderSnapshot.diagnosis, "Diagnosis"),
    getPrintableText(jobOrderSnapshot.workPerformed, "Work performed"),
  ].filter(Boolean);

  return sections.length > 0 ? sections.join("\n\n") : null;
}

function getPrintableText(value: string | null, label: string) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "—" || trimmed === "-") {
    return null;
  }

  return `${label}: ${trimmed}`;
}

function buildInvoiceLineRows(items: InvoiceItemDetail[]): InvoiceLineRow[] {
  const partItems = items.filter((item) => item.itemType === "product");
  const laborItems = items.filter(
    (item) => item.itemType === "service" || item.itemType === "labor",
  );
  const rows: InvoiceLineRow[] = [];
  let displayLineNumber = 1;

  if (partItems.length > 0) {
    rows.push({ kind: "group", key: "parts-group", label: "PARTS" });
    rows.push(
      ...partItems.map((item) => ({
        kind: "item" as const,
        key: item.id,
        displayLineNumber: displayLineNumber++,
        description: item.description,
        subtext: "Product",
        quantityLabel: formatQuantity(item.quantity),
        unitPrice: item.unitPrice,
        amount: item.total,
      })),
    );
  }

  if (laborItems.length > 0) {
    rows.push({
      kind: "group",
      key: "labor-group",
      label: "LABOR / SERVICES",
    });
    rows.push(
      ...laborItems.map((item) => ({
        kind: "item" as const,
        key: item.id,
        displayLineNumber: displayLineNumber++,
        description: item.description,
        subtext: item.itemType === "service" ? "Service" : "Labor",
        quantityLabel: formatQuantity(item.quantity),
        unitPrice: item.unitPrice,
        amount: item.total,
      })),
    );
  }

  return rows;
}

function buildInvoicePrintPages(params: {
  lineItems: InvoiceLineRow[];
  payments: InvoicePaymentEntry[];
  isCancelled: boolean;
  hasWorkSummary: boolean;
}): InvoicePrintPageModel[] {
  const { lineItems, payments, isCancelled, hasWorkSummary } = params;
  const introUnits = getInvoiceIntroUnits(isCancelled);
  const closingUnits = getInvoiceClosingUnits(hasWorkSummary);
  const totalLineUnits = estimateLineRowsUnits(lineItems);
  const totalPaymentUnits = estimatePaymentUnits(payments);

  if (introUnits + totalLineUnits + totalPaymentUnits + closingUnits <= INVOICE_PAGE_CAPACITY) {
    return [
      {
        key: "invoice-page-1",
        lineRows: lineItems,
        paymentRows: payments,
        includeIntro: true,
        includeClosing: true,
      },
    ];
  }

  const finalPaymentsStartIndex = findTrailingPaymentStartIndex(
    payments,
    Math.max(2.2, INVOICE_PAGE_CAPACITY - closingUnits),
  );
  const overflowPayments = payments.slice(0, finalPaymentsStartIndex);
  const finalPayments = payments.slice(finalPaymentsStartIndex);
  const finalLineCapacity = Math.max(
    0,
    INVOICE_PAGE_CAPACITY -
      closingUnits -
      estimatePaymentUnits(finalPayments),
  );
  const pages: InvoicePrintPageModel[] = [];
  const firstLineChunk = takeLineRowsForCapacity(
    lineItems,
    0,
    null,
    Math.max(3.5, INVOICE_PAGE_CAPACITY - introUnits),
  );

  pages.push({
    key: "invoice-page-1",
    lineRows: firstLineChunk.rows,
    paymentRows: [],
    includeIntro: true,
    includeClosing: false,
  });

  let lineIndex = firstLineChunk.nextIndex;
  let activeGroup = firstLineChunk.activeGroup;
  let pageNumber = 2;

  while (
    lineIndex < lineItems.length &&
    estimateRemainingLineUnits(lineItems, lineIndex, activeGroup) > finalLineCapacity
  ) {
    const nextLines = takeLineRowsForCapacity(
      lineItems,
      lineIndex,
      activeGroup,
      INVOICE_CONTINUATION_CAPACITY,
    );

    pages.push({
      key: `invoice-page-${pageNumber++}`,
      lineRows: nextLines.rows,
      paymentRows: [],
      includeIntro: false,
      includeClosing: false,
    });
    lineIndex = nextLines.nextIndex;
    activeGroup = nextLines.activeGroup;
  }

  let paymentIndex = 0;

  while (
    paymentIndex < overflowPayments.length &&
    estimateRemainingPaymentUnits(overflowPayments, paymentIndex) > 0
  ) {
    const paymentChunk = takePaymentsForCapacity(
      overflowPayments,
      paymentIndex,
      INVOICE_CONTINUATION_CAPACITY,
    );

    pages.push({
      key: `invoice-page-${pageNumber++}`,
      lineRows: [],
      paymentRows: paymentChunk.rows,
      includeIntro: false,
      includeClosing: false,
    });
    paymentIndex = paymentChunk.nextIndex;
  }

  pages.push({
    key: `invoice-page-${pageNumber}`,
    lineRows: buildRemainingRowsForFinalPage(lineItems, lineIndex, activeGroup),
    paymentRows: finalPayments,
    includeIntro: false,
    includeClosing: true,
  });

  return pages;
}

function takeLineRowsForCapacity(
  rows: InvoiceLineRow[],
  startIndex: number,
  activeGroup: "PARTS" | "LABOR / SERVICES" | null,
  capacity: number,
) {
  const pageStartGroup = activeGroup;
  const pageRows: InvoiceLineRow[] = [];
  let nextIndex = startIndex;
  let currentGroup = activeGroup;
  let units = 0;
  let insertedCarryover = false;

  if (currentGroup && rows[nextIndex]?.kind === "item") {
    const carryover = buildCarryoverGroupRow(currentGroup, nextIndex);
    pageRows.push(carryover);
    units += estimateLineRowUnits(carryover);
    insertedCarryover = true;
  }

  while (nextIndex < rows.length) {
    const row = rows[nextIndex];
    const rowUnits = estimateLineRowUnits(row);

    if (pageRows.length > 0 && units + rowUnits > capacity) {
      break;
    }

    pageRows.push(row);
    units += rowUnits;
    nextIndex += 1;

    if (row.kind === "group") {
      currentGroup = row.label;
    }
  }

  while (pageRows.at(-1)?.kind === "group") {
    pageRows.pop();
    nextIndex -= 1;
    currentGroup = resolveActiveGroup(pageRows, pageStartGroup);
  }

  if (
    pageRows.length === 0 ||
    (pageRows.length === 1 && insertedCarryover && pageRows[0]?.kind === "group")
  ) {
    pageRows.length = 0;

    if (currentGroup && rows[nextIndex]?.kind === "item") {
      pageRows.push(buildCarryoverGroupRow(currentGroup, nextIndex));
    }

    const forcedRow = rows[nextIndex];

    if (forcedRow) {
      pageRows.push(forcedRow);
      nextIndex += 1;
      if (forcedRow.kind === "group") {
        currentGroup = forcedRow.label;
      }
    }
  }

  return {
    rows: pageRows,
    nextIndex,
    activeGroup: resolveActiveGroup(pageRows, pageStartGroup),
  };
}

function buildRemainingRowsForFinalPage(
  rows: InvoiceLineRow[],
  startIndex: number,
  activeGroup: "PARTS" | "LABOR / SERVICES" | null,
) {
  const remainingRows: InvoiceLineRow[] = [];

  if (activeGroup && rows[startIndex]?.kind === "item") {
    remainingRows.push(buildCarryoverGroupRow(activeGroup, startIndex));
  }

  return remainingRows.concat(rows.slice(startIndex));
}

function buildCarryoverGroupRow(
  label: "PARTS" | "LABOR / SERVICES",
  rowIndex: number,
): InvoiceLineRow {
  return {
    kind: "group",
    key: `continued-${label}-${rowIndex}`,
    label,
  };
}

function resolveActiveGroup(
  rows: InvoiceLineRow[],
  initialGroup: "PARTS" | "LABOR / SERVICES" | null,
) {
  let currentGroup = initialGroup;

  for (const row of rows) {
    if (row.kind === "group") {
      currentGroup = row.label;
    }
  }

  return currentGroup;
}

function estimateRemainingLineUnits(
  rows: InvoiceLineRow[],
  startIndex: number,
  activeGroup: "PARTS" | "LABOR / SERVICES" | null,
) {
  return estimateLineRowsUnits(
    buildRemainingRowsForFinalPage(rows, startIndex, activeGroup),
  );
}

function estimateLineRowsUnits(rows: InvoiceLineRow[]) {
  return rows.reduce((sum, row) => sum + estimateLineRowUnits(row), 0);
}

function estimateLineRowUnits(row: InvoiceLineRow) {
  if (row.kind === "group") {
    return 0.65;
  }

  let units = 1.12;

  if (row.subtext) {
    units += 0.18;
  }

  if (row.description.length > 52) {
    units += 0.22;
  }

  if (row.description.length > 92) {
    units += 0.18;
  }

  return units;
}

function takePaymentsForCapacity(
  rows: InvoicePaymentEntry[],
  startIndex: number,
  capacity: number,
) {
  const pageRows: InvoicePaymentEntry[] = [];
  let nextIndex = startIndex;
  let units = 0;

  while (nextIndex < rows.length) {
    const row = rows[nextIndex];
    const rowUnits = estimatePaymentRowUnits(row);

    if (pageRows.length > 0 && units + rowUnits > capacity) {
      break;
    }

    pageRows.push(row);
    units += rowUnits;
    nextIndex += 1;
  }

  if (pageRows.length === 0 && rows[nextIndex]) {
    pageRows.push(rows[nextIndex]);
    nextIndex += 1;
  }

  return {
    rows: pageRows,
    nextIndex,
  };
}

function findTrailingPaymentStartIndex(
  rows: InvoicePaymentEntry[],
  capacity: number,
) {
  let units = 0;
  let index = rows.length;

  while (index > 0) {
    const row = rows[index - 1];
    const rowUnits = estimatePaymentRowUnits(row);

    if (index < rows.length && units + rowUnits > capacity) {
      break;
    }

    units += rowUnits;
    index -= 1;
  }

  return index;
}

function estimateRemainingPaymentUnits(
  rows: InvoicePaymentEntry[],
  startIndex: number,
) {
  return rows
    .slice(startIndex)
    .reduce((sum, row) => sum + estimatePaymentRowUnits(row), 0);
}

function estimatePaymentUnits(rows: InvoicePaymentEntry[]) {
  return rows.reduce((sum, row) => sum + estimatePaymentRowUnits(row), 0);
}

function estimatePaymentRowUnits(row: InvoicePaymentEntry) {
  let units = 0.95;

  if ((row.referenceNumber ?? "").length > 18) {
    units += 0.15;
  }

  return units;
}

function getInvoiceIntroUnits(isCancelled: boolean) {
  return isCancelled ? 5.4 : 4.6;
}

function getInvoiceClosingUnits(hasWorkSummary: boolean) {
  return hasWorkSummary ? 6.2 : 5.4;
}

function formatVehicleModel(invoice: InvoicePrintDocument["invoice"]) {
  if (invoice.vehicleMake && invoice.vehicleModel) {
    const yearPart = invoice.vehicleYear ? ` (${invoice.vehicleYear})` : "";
    return `${invoice.vehicleMake} ${invoice.vehicleModel}${yearPart}`;
  }

  return invoice.vehicleLabel;
}

function formatMileage(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${new Intl.NumberFormat("en-PH").format(value)} km`;
}

function formatQuantity(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
