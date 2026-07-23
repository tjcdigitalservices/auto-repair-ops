"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Printer, Trash2, X } from "lucide-react";

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
  TableRowActionsMenuConfirm,
  TableRowActionsMenuLink,
  TableRowActionsMenuSeparator,
} from "@/components/shared/table-row-actions-menu";
import {
  deleteQuotationAction,
  rejectQuotationAction,
} from "@/features/quotations/actions/quotation-actions";
import { QuotationDetailPrimaryAction } from "@/features/quotations/components/quotation-detail-primary-action";
import { QuotationDetailSidebar } from "@/features/quotations/components/quotation-detail-sidebar";
import { QuotationLineItemsTab } from "@/features/quotations/components/quotation-line-items-tab";
import {
  QuotationRelatedDocumentsTab,
  type QuotationRelatedDocument,
} from "@/features/quotations/components/quotation-related-documents-tab";
import { QuotationRevisionHistoryTab } from "@/features/quotations/components/quotation-revision-history-tab";
import { formatQuotationStatus } from "@/features/quotations/components/quotation-status-badge";
import type { QuotationRevisionHistoryItem } from "@/features/quotations/queries/quotation-revision-history-queries";
import type { QuotationDetail } from "@/features/quotations/types";
import { formatLastRevisedLabel } from "@/features/quotations/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

const BASE_QUOTATION_DETAIL_TABS = [
  { id: "line-items", label: "Line items" },
  { id: "documents", label: "Related documents" },
] as const;

const REVISION_HISTORY_TAB = { id: "revision-history", label: "Revision History" } as const;

type QuotationDetailTabId =
  | (typeof BASE_QUOTATION_DETAIL_TABS)[number]["id"]
  | typeof REVISION_HISTORY_TAB.id;

export function QuotationDetailPageContent({
  quotation,
  relatedDocuments,
  revisionHistory,
  canEdit,
  canApprove,
  canDelete,
}: {
  quotation: QuotationDetail;
  relatedDocuments: QuotationRelatedDocument[];
  revisionHistory: QuotationRevisionHistoryItem[];
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showRevisionHistory = quotation.status === "approved";
  const tabs = showRevisionHistory
    ? [...BASE_QUOTATION_DETAIL_TABS, REVISION_HISTORY_TAB]
    : [...BASE_QUOTATION_DETAIL_TABS];
  const initialTab = resolveQuotationDetailTab(searchParams.get("tab"), showRevisionHistory);
  const [activeTab, setActiveTab] = useState<QuotationDetailTabId>(initialTab);
  const lastRevision = revisionHistory[0] ?? null;

  const updateTab = useCallback(
    (nextTab: QuotationDetailTabId) => {
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
          title={quotation.quotationNumber}
          description={`${quotation.customerName} · ${quotation.vehicleLabel}`}
          backHref="/quotations"
          backLabel="Back to quotations"
          metadata={
            <>
              <MetadataPill tone={statusTone(quotation.status)}>
                {formatQuotationStatus(quotation.status)}
              </MetadataPill>
              <MetadataPill>{formatCurrency(quotation.totalAmount)}</MetadataPill>
              <MetadataPill>
                {quotation.approvedAt
                  ? `Approved ${formatDate(quotation.approvedAt)}`
                  : `Created ${formatDate(quotation.createdAt)}`}
              </MetadataPill>
              {lastRevision ? (
                <MetadataPill tone="info">{formatLastRevisedLabel(lastRevision.revisedAt)}</MetadataPill>
              ) : null}
            </>
          }
          actions={
            <PageHeaderActions
              primary={
                <QuotationDetailPrimaryAction
                  quotationId={quotation.id}
                  quotationNumber={quotation.quotationNumber}
                  canApprove={canApprove}
                  isApproved={quotation.status === "approved"}
                />
              }
              overflow={
                <TableRowActionsMenu label="Quotation actions" variant="page">
                  {canEdit ? (
                    <TableRowActionsMenuLink
                      href={`/quotations/${quotation.id}/edit`}
                      label="Edit Quotation"
                      iconName="pencil"
                    />
                  ) : null}
                  <TableRowActionsMenuButton
                    label="Print quotation"
                    icon={Printer}
                    onSelect={() =>
                      window.open(`/quotations/${quotation.id}/print`, "_blank", "noopener,noreferrer")
                    }
                  />
                  <TableRowActionsMenuLink
                    href={`/api/quotations/${quotation.id}/pdf`}
                    label="Download PDF"
                    icon={Download}
                  />
                  {canApprove || canDelete ? <TableRowActionsMenuSeparator /> : null}
                  {canApprove ? (
                    <TableRowActionsMenuConfirm
                      label="Reject quotation"
                      title={`Reject ${quotation.quotationNumber}?`}
                      description="This quotation will be marked as rejected."
                      confirmLabel="Reject quotation"
                      cancelLabel="Keep quotation"
                      icon={X}
                      action={rejectQuotationAction}
                      fields={[{ name: "quotationId", value: quotation.id }]}
                    />
                  ) : null}
                  {canDelete ? (
                    <TableRowActionsMenuConfirm
                      label="Delete quotation"
                      title={`Delete ${quotation.quotationNumber}?`}
                      description="This quotation and its line items will be removed permanently."
                      confirmLabel="Delete quotation"
                      cancelLabel="Keep quotation"
                      icon={Trash2}
                      action={deleteQuotationAction}
                      fields={[{ name: "quotationId", value: quotation.id }]}
                    />
                  ) : null}
                </TableRowActionsMenu>
              }
            />
          }
        />
      }
      sidebar={
        <EntityDetailSidebar>
          <QuotationDetailSidebar quotation={quotation} />
        </EntityDetailSidebar>
      }
    >
      <EntityDetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => updateTab(tabId as QuotationDetailTabId)}
      />

      <EntityDetailTabPanel activeTab={activeTab} tabId="line-items" className="pt-6">
        <QuotationLineItemsTab
          items={quotation.items}
          subtotal={quotation.subtotal}
          discount={quotation.discount}
          tax={quotation.tax}
          totalAmount={quotation.totalAmount}
        />
      </EntityDetailTabPanel>

      <EntityDetailTabPanel activeTab={activeTab} tabId="documents" className="pt-6">
        <QuotationRelatedDocumentsTab documents={relatedDocuments} />
      </EntityDetailTabPanel>

      {showRevisionHistory ? (
        <EntityDetailTabPanel activeTab={activeTab} tabId="revision-history" className="pt-6">
          <QuotationRevisionHistoryTab revisions={revisionHistory} />
        </EntityDetailTabPanel>
      ) : null}
    </EntityDetailLayout>
  );
}

function resolveQuotationDetailTab(
  tab: string | null,
  showRevisionHistory: boolean,
): QuotationDetailTabId {
  if (tab === "documents") {
    return tab;
  }

  if (tab === "revision-history" && showRevisionHistory) {
    return tab;
  }

  return "line-items";
}

function statusTone(status: QuotationDetail["status"]): "neutral" | "success" | "warning" | "info" {
  if (status === "approved") {
    return "success";
  }

  if (status === "pending_approval") {
    return "warning";
  }

  if (status === "rejected" || status === "expired") {
    return "warning";
  }

  return "neutral";
}
