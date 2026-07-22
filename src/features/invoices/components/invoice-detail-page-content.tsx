"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Download, Printer } from "lucide-react";

import {
  EntityDetailHeader,
  EntityDetailLayout,
  EntityDetailSidebar,
  EntityDetailTabPanel,
  EntityDetailTabs,
  MetadataPill,
} from "@/components/shared/entity-detail";
import { PageHeaderActions } from "@/components/shared/page-header-actions";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
  TableRowActionsMenuSeparator,
} from "@/components/shared/table-row-actions-menu";
import { Button } from "@/components/ui/button";
import { InvoiceDetailSidebar } from "@/features/invoices/components/invoice-detail-sidebar";
import { InvoiceLineItemsTab } from "@/features/invoices/components/invoice-line-items-tab";
import { InvoicePaymentsTab } from "@/features/invoices/components/invoice-payments-tab";
import type { InvoiceDetail } from "@/features/invoices/types";
import { formatInvoiceStatus } from "@/features/invoices/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

const INVOICE_DETAIL_TABS = [
  { id: "line-items", label: "Line items" },
  { id: "payments", label: "Payments" },
] as const;

type InvoiceDetailTabId = (typeof INVOICE_DETAIL_TABS)[number]["id"];

export function InvoiceDetailPageContent({
  invoice,
  canCancel,
}: {
  invoice: InvoiceDetail;
  canCancel: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = resolveInvoiceDetailTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<InvoiceDetailTabId>(initialTab);

  const updateTab = useCallback(
    (nextTab: InvoiceDetailTabId) => {
      setActiveTab(nextTab);

      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === "line-items") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <EntityDetailLayout
      header={
        <EntityDetailHeader
          title={invoice.invoiceNumber}
          description={`${invoice.customerName} · ${invoice.vehicleLabel}`}
          backHref="/invoices"
          backLabel="Back to invoices"
          metadata={
            <>
              <MetadataPill tone={statusTone(invoice.status)}>
                {formatInvoiceStatus(invoice.status)}
              </MetadataPill>
              <MetadataPill>{formatCurrency(invoice.balance)} balance</MetadataPill>
              <MetadataPill>
                {invoice.cancelledAt
                  ? `Cancelled ${formatDate(invoice.cancelledAt)}`
                  : invoice.releasedAt
                    ? `Released ${formatDate(invoice.releasedAt)}`
                    : `Invoiced ${formatDate(invoice.invoiceDate)}`}
              </MetadataPill>
            </>
          }
          actions={
            <PageHeaderActions
              primary={
                invoice.canRecordPayment ? (
                  <Button type="button" onClick={() => updateTab("payments")}>
                    Record Payment
                  </Button>
                ) : null
              }
              overflow={
                <TableRowActionsMenu label="Invoice actions" variant="page">
                  <TableRowActionsMenuButton
                    label="Print invoice"
                    icon={Printer}
                    onSelect={() =>
                      window.open(`/invoices/${invoice.id}/print`, "_blank", "noopener,noreferrer")
                    }
                  />
                  <TableRowActionsMenuLink
                    href={`/api/invoices/${invoice.id}/pdf`}
                    label="Download PDF"
                    icon={Download}
                  />
                  {invoice.jobOrderId ? (
                    <>
                      <TableRowActionsMenuSeparator />
                      <TableRowActionsMenuLink
                        href={`/job-orders/${invoice.jobOrderId}`}
                        label="View job order"
                        icon={ClipboardList}
                      />
                    </>
                  ) : null}
                </TableRowActionsMenu>
              }
            />
          }
        />
      }
      sidebar={
        <EntityDetailSidebar>
          <InvoiceDetailSidebar invoice={invoice} />
        </EntityDetailSidebar>
      }
    >
      <EntityDetailTabs
        tabs={[...INVOICE_DETAIL_TABS]}
        activeTab={activeTab}
        onTabChange={(tabId) => updateTab(tabId as InvoiceDetailTabId)}
      />

      <EntityDetailTabPanel activeTab={activeTab} tabId="line-items" className="pt-6">
        <InvoiceLineItemsTab items={invoice.items} />
      </EntityDetailTabPanel>

      <EntityDetailTabPanel activeTab={activeTab} tabId="payments" className="pt-6">
        <InvoicePaymentsTab invoice={invoice} canCancel={canCancel} />
      </EntityDetailTabPanel>
    </EntityDetailLayout>
  );
}

function resolveInvoiceDetailTab(tab: string | null): InvoiceDetailTabId {
  if (tab === "payments") {
    return tab;
  }

  return "line-items";
}

function statusTone(status: InvoiceDetail["status"]): "neutral" | "success" | "warning" | "info" {
  if (status === "paid") {
    return "success";
  }

  if (status === "partially_paid") {
    return "info";
  }

  if (status === "cancelled") {
    return "warning";
  }

  return "neutral";
}
