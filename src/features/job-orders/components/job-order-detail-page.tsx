"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  EntityDataTable,
  EntityDataTableBody,
  EntityDataTableCell,
  EntityDataTableHead,
  EntityDataTableHeader,
  EntityDataTableRow,
  EntityDetailField,
  EntityDetailHeader,
  EntityDetailLayout,
  EntityDetailSection,
  EntityDetailSidebar,
  EntityDetailTabPanel,
  EntityDetailTabs,
  MetadataPill,
} from "@/components/shared/entity-detail";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { MetricGrid } from "@/components/shared/metric-grid";
import { SearchInput } from "@/components/shared/search-input";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import {
  TableRowActionsMenu,
} from "@/components/shared/table-row-actions-menu";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { CreateInvoiceForm } from "@/features/invoices/components/create-invoice-form";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import {
  removeMechanicAction,
} from "@/features/job-orders/actions/job-order-actions";
import { AssignMechanicForm } from "@/features/job-orders/components/assign-mechanic-form";
import { JobOrderAdditionalItemDialog } from "@/features/job-orders/components/job-order-additional-item-dialog";
import { JobOrderChecklistPanel } from "@/features/job-orders/components/job-order-checklist-panel";
import { JobOrderDetailHeaderActions } from "@/features/job-orders/components/job-order-detail-header-actions";
import { JobOrderDetailSidebar } from "@/features/job-orders/components/job-order-detail-sidebar";
import { JobOrderDetailsForm } from "@/features/job-orders/components/job-order-details-form";
import { JobOrderItemApprovalAction } from "@/features/job-orders/components/job-order-item-approval-action";
import { JobOrderItemEditDialog } from "@/features/job-orders/components/job-order-item-edit-dialog";
import { JobOrderPartsUsagePanel } from "@/features/job-orders/components/job-order-parts-usage-panel";
import { JobOrderStatusWorkflow } from "@/features/job-orders/components/job-order-status-workflow";
import type {
  JobOrderDetail,
  JobOrderDetailTab,
  JobOrderItemDetail,
  JobOrderMechanicOption,
} from "@/features/job-orders/types";
import { formatJobOrderStatus, resolveJobOrderDetailTab } from "@/features/job-orders/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

const JOB_ORDER_TABS = [
  { id: "overview", label: "Overview" },
  { id: "billing", label: "Billing" },
  { id: "work-items", label: "Work items" },
  { id: "parts-usage", label: "Parts usage" },
  { id: "mechanics", label: "Mechanics" },
] as const;

export function JobOrderDetailPage({
  jobOrder,
  availableMechanics,
  activeTab: initialTab,
  canDeleteJobOrder = false,
}: {
  jobOrder: JobOrderDetail;
  availableMechanics: JobOrderMechanicOption[];
  activeTab: JobOrderDetailTab;
  canDeleteJobOrder?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<JobOrderDetailTab>(
    resolveJobOrderDetailTab(searchParams.get("tab") ?? initialTab),
  );

  const updateTab = useCallback(
    (nextTab: JobOrderDetailTab) => {
      setActiveTab(nextTab);

      const params = new URLSearchParams(searchParams.toString());
      if (nextTab === "overview") {
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
    <div className="space-y-6">
      {jobOrder.isHistorical ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Historical service record for{" "}
          {jobOrder.serviceDate ? formatDate(jobOrder.serviceDate) : "a past visit"}. This entry
          is read-only and excluded from billing, inventory, and status workflows.
        </div>
      ) : null}

      <EntityDetailLayout
        header={
          <EntityDetailHeader
            title={jobOrder.jobOrderNumber}
            description={`${jobOrder.customerName} · ${jobOrder.vehicleLabel}`}
            backHref="/job-orders"
            backLabel="Back to job orders"
            metadata={
              <>
                <MetadataPill tone={statusTone(jobOrder.status)}>
                  {formatJobOrderStatus(jobOrder.status)}
                </MetadataPill>
                {jobOrder.status === "released" ? (
                  <MetadataPill>Finalized</MetadataPill>
                ) : null}
                <MetadataPill>{formatCurrency(jobOrder.billableTotal)}</MetadataPill>
                <MetadataPill>Created {formatDate(jobOrder.createdAt)}</MetadataPill>
              </>
            }
            actions={
              <JobOrderDetailHeaderActions
                jobOrder={jobOrder}
                canDeleteJobOrder={canDeleteJobOrder}
              />
            }
          />
        }
        sidebar={
          <EntityDetailSidebar>
            <JobOrderDetailSidebar jobOrder={jobOrder} />
          </EntityDetailSidebar>
        }
      >
        <EntityDetailTabs
          tabs={[...JOB_ORDER_TABS]}
          activeTab={activeTab}
          onTabChange={(tabId) => updateTab(tabId as JobOrderDetailTab)}
        />

        <EntityDetailTabPanel activeTab={activeTab} tabId="overview" className="space-y-5 pt-6">
          <SectionCard
            title="Job progress"
            description="Advance the job through the shop workflow from here."
          >
            <JobOrderStatusWorkflow jobOrder={jobOrder} redirectTab={activeTab} />
          </SectionCard>

          {jobOrder.canEditDetails ? (
            <JobOrderDetailsForm detail={jobOrder} redirectTab={activeTab} />
          ) : (
            <ReadOnlyOperationalNotes detail={jobOrder} />
          )}
        </EntityDetailTabPanel>

        <EntityDetailTabPanel activeTab={activeTab} tabId="billing" className="pt-6">
          <BillingTab jobOrder={jobOrder} />
        </EntityDetailTabPanel>

        <EntityDetailTabPanel activeTab={activeTab} tabId="work-items" className="pt-6">
          <WorkItemsTab jobOrder={jobOrder} activeTab={activeTab} />
        </EntityDetailTabPanel>

        <EntityDetailTabPanel activeTab={activeTab} tabId="parts-usage" className="pt-6">
          <JobOrderPartsUsagePanel
            jobOrderId={jobOrder.id}
            items={jobOrder.items}
            status={jobOrder.status}
            redirectTab={activeTab}
          />
        </EntityDetailTabPanel>

        <EntityDetailTabPanel activeTab={activeTab} tabId="mechanics" className="pt-6">
          <MechanicsTab
            jobOrder={jobOrder}
            availableMechanics={availableMechanics}
            activeTab={activeTab}
          />
        </EntityDetailTabPanel>
      </EntityDetailLayout>
    </div>
  );
}

function BillingTab({ jobOrder }: { jobOrder: JobOrderDetail }) {
  return (
    <div className="space-y-4">
      <MetricGrid className="grid-cols-1 md:grid-cols-3">
        <StatCard title="Billable total" value={formatCurrency(jobOrder.billableTotal)} />
        <StatCard
          title="Pending extras"
          value={String(jobOrder.pendingApprovalCount)}
          description={
            jobOrder.pendingApprovalCount > 0
              ? formatCurrency(jobOrder.pendingApprovalTotal)
              : "No pending value"
          }
          tone={jobOrder.pendingApprovalCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="Rejected extras"
          value={
            jobOrder.rejectedAdditionalTotal > 0
              ? formatCurrency(jobOrder.rejectedAdditionalTotal)
              : "None"
          }
          description="Excluded from invoice generation"
          tone={jobOrder.rejectedAdditionalTotal > 0 ? "destructive" : "neutral"}
        />
      </MetricGrid>

      <div className="rounded-xl border border-border/70 bg-muted/10 p-4">
        {jobOrder.invoiceId ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-semibold">{jobOrder.invoiceNumber}</p>
                {jobOrder.invoiceStatus ? (
                  <InvoiceStatusBadge status={jobOrder.invoiceStatus} />
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Paid {formatCurrency(jobOrder.invoicePaidAmount ?? 0)} of{" "}
                {formatCurrency(jobOrder.invoiceTotalAmount ?? 0)} · Balance{" "}
                {formatCurrency(jobOrder.invoiceBalance ?? 0)}
              </p>
            </div>
            <Button asChild>
              <Link href={`/invoices/${jobOrder.invoiceId}`}>Open invoice</Link>
            </Button>
          </div>
        ) : jobOrder.canGenerateInvoice ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {jobOrder.requireInvoiceBeforeJobCompletion ||
              jobOrder.requireInvoiceBeforeVehicleRelease
                ? "No invoice generated yet. Generate one now to satisfy the current branch completion or release rules."
                : "No invoice generated yet. This job order can still move through completion or release because invoice generation is optional for this branch."}
            </p>
            <CreateInvoiceForm jobOrderId={jobOrder.id} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {jobOrder.status === "pending" ||
            jobOrder.status === "in_progress" ||
            jobOrder.status === "waiting_for_parts" ||
            jobOrder.status === "waiting_for_customer_approval"
              ? "Move the job order to Completed before generating an invoice."
              : "Invoice generation is not available for this job order yet."}
          </p>
        )}
      </div>
    </div>
  );
}

function WorkItemsTab({
  jobOrder,
  activeTab,
}: {
  jobOrder: JobOrderDetail;
  activeTab: JobOrderDetailTab;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobOrder.items.filter((item) => {
      if (typeFilter && item.itemType !== typeFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.description.toLowerCase().includes(query) ||
        item.itemType.toLowerCase().includes(query) ||
        String(item.lineNumber).includes(query)
      );
    });
  }, [jobOrder.items, search, typeFilter]);

  if (jobOrder.items.length === 0) {
    return (
      <EmptyState
        title="No work items yet"
        description="Add quoted lines or additional charges to track work on this job order."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar className="min-w-0 flex-1 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px]">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search description or type"
            />
            <NativeSelect value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All types</option>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="labor">Labor</option>
            </NativeSelect>
          </FilterBar>
          {jobOrder.canAddAdditionalItems ? (
            <JobOrderAdditionalItemDialog jobOrderId={jobOrder.id} redirectTab={activeTab} />
          ) : null}
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            title="No work items match your filters"
            description="Try a different search term or clear the current filters."
          />
        ) : (
          <EntityDataTable>
            <EntityDataTableHeader>
              <EntityDataTableRow>
                <EntityDataTableHead>Line</EntityDataTableHead>
                <EntityDataTableHead>Description</EntityDataTableHead>
                <EntityDataTableHead>Type</EntityDataTableHead>
                <EntityDataTableHead className="text-right">Total</EntityDataTableHead>
                <EntityDataTableHead className="text-right">Actions</EntityDataTableHead>
              </EntityDataTableRow>
            </EntityDataTableHeader>
            <EntityDataTableBody>
              {filteredItems.map((item) => (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  jobOrder={jobOrder}
                  activeTab={activeTab}
                />
              ))}
            </EntityDataTableBody>
          </EntityDataTable>
        )}
      </div>

      <JobOrderChecklistPanel
        jobOrderId={jobOrder.id}
        items={jobOrder.items}
        canUpdateChecklist={jobOrder.canUpdateChecklist}
        redirectTab={activeTab}
      />
    </div>
  );
}

function WorkItemRow({
  item,
  jobOrder,
  activeTab,
}: {
  item: JobOrderItemDetail;
  jobOrder: JobOrderDetail;
  activeTab: JobOrderDetailTab;
}) {
  const showApproval =
    jobOrder.canResolveAdditionalItems &&
    item.isAdditional &&
    item.approvalStatus === "pending";
  const showEdit = jobOrder.canEditItems;
  const hasActions = showEdit || showApproval;

  return (
    <EntityDataTableRow
      className={cn(
        item.isAdditional && item.approvalStatus === "pending" && "bg-warning/5",
        item.isAdditional && item.approvalStatus === "rejected" && "bg-destructive/5",
      )}
    >
      <EntityDataTableCell className="font-medium text-muted-foreground">
        {item.lineNumber}
        {item.isAdditional ? " · Extra" : ""}
      </EntityDataTableCell>
      <EntityDataTableCell>
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium text-foreground">{item.description}</p>
          <p className="text-xs text-muted-foreground">
            {item.quantity} × {formatCurrency(item.unitPrice)}
          </p>
          {item.isAdditional && item.approvalStatus === "rejected" ? (
            <p className="text-xs text-destructive">Rejected extra. Excluded from billing.</p>
          ) : null}
        </div>
      </EntityDataTableCell>
      <EntityDataTableCell className="capitalize text-muted-foreground">{item.itemType}</EntityDataTableCell>
      <EntityDataTableCell className="text-right font-medium">
        {formatCurrency(item.total)}
      </EntityDataTableCell>
      <EntityDataTableCell className="text-right">
        {hasActions ? (
          <div className="flex items-center justify-end gap-2">
            {showEdit ? (
              <JobOrderItemEditDialog
                jobOrderId={jobOrder.id}
                item={item}
                redirectTab={activeTab}
              />
            ) : null}
            {showApproval ? (
              <TableRowActionsMenu label={`Approval actions for ${item.description}`}>
                <JobOrderItemApprovalAction
                  label="Approve extra item"
                  jobOrderId={jobOrder.id}
                  jobOrderItemId={item.id}
                  approvalStatus="approved"
                  redirectTab={activeTab}
                />
                <JobOrderItemApprovalAction
                  label="Reject extra item"
                  jobOrderId={jobOrder.id}
                  jobOrderItemId={item.id}
                  approvalStatus="rejected"
                  redirectTab={activeTab}
                  tone="destructive"
                />
              </TableRowActionsMenu>
            ) : null}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </EntityDataTableCell>
    </EntityDataTableRow>
  );
}

function MechanicsTab({
  jobOrder,
  availableMechanics,
  activeTab,
}: {
  jobOrder: JobOrderDetail;
  availableMechanics: JobOrderMechanicOption[];
  activeTab: JobOrderDetailTab;
}) {
  const [search, setSearch] = useState("");

  const filteredMechanics = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return jobOrder.mechanics;
    }

    return jobOrder.mechanics.filter((mechanic) => {
      return (
        mechanic.fullName.toLowerCase().includes(query) ||
        (mechanic.taskDescription?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [jobOrder.mechanics, search]);

  return (
    <div className="space-y-5">
      {jobOrder.mechanics.length === 0 ? (
        <EmptyState
          title="No mechanics assigned"
          description="Assign one or more mechanics to start ownership of the work."
        />
      ) : (
        <div className="space-y-4">
          <FilterBar className="grid gap-3 md:grid-cols-[minmax(0,1fr)]">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search mechanic or task"
            />
          </FilterBar>

          {filteredMechanics.length === 0 ? (
            <EmptyState
              title="No mechanics match your search"
              description="Try a different search term."
            />
          ) : (
            <EntityDataTable>
              <EntityDataTableHeader>
                <EntityDataTableRow>
                  <EntityDataTableHead>Mechanic</EntityDataTableHead>
                  <EntityDataTableHead>Task</EntityDataTableHead>
                  <EntityDataTableHead>Started</EntityDataTableHead>
                  <EntityDataTableHead className="text-right">Actions</EntityDataTableHead>
                </EntityDataTableRow>
              </EntityDataTableHeader>
              <EntityDataTableBody>
                {filteredMechanics.map((mechanic) => (
                  <EntityDataTableRow key={mechanic.id}>
                    <EntityDataTableCell className="font-medium">{mechanic.fullName}</EntityDataTableCell>
                    <EntityDataTableCell className="text-muted-foreground">
                      {mechanic.taskDescription?.trim() || "-"}
                    </EntityDataTableCell>
                    <EntityDataTableCell className="text-muted-foreground">
                      {mechanic.startedAt ? formatDateTime(mechanic.startedAt) : "-"}
                    </EntityDataTableCell>
                    <EntityDataTableCell className="text-right">
                      {jobOrder.canAssignMechanics ? (
                        <form action={removeMechanicAction}>
                          <input type="hidden" name="jobOrderId" value={jobOrder.id} />
                          <input type="hidden" name="assignmentId" value={mechanic.id} />
                          <input type="hidden" name="redirectTab" value={activeTab} />
                          <Button type="submit" size="sm" variant="ghost">
                            Remove
                          </Button>
                        </form>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </EntityDataTableCell>
                  </EntityDataTableRow>
                ))}
              </EntityDataTableBody>
            </EntityDataTable>
          )}
        </div>
      )}

      {jobOrder.canAssignMechanics ? (
        <AssignMechanicForm
          jobOrderId={jobOrder.id}
          mechanics={availableMechanics}
          redirectTab={activeTab}
        />
      ) : null}
    </div>
  );
}

function ReadOnlyOperationalNotes({ detail }: { detail: JobOrderDetail }) {
  return (
    <EntityDetailSection title="Operational notes">
      <div className="space-y-4 rounded-xl border border-border/70 bg-background p-5">
        <EntityDetailField label="Mileage in">
          {detail.mileageIn !== null ? String(detail.mileageIn) : null}
        </EntityDetailField>
        <EntityDetailField label="Mileage out">
          {detail.mileageOut !== null ? String(detail.mileageOut) : null}
        </EntityDetailField>
        <EntityDetailField label="Customer concern">
          {detail.customerConcern?.trim() ? (
            <p className="whitespace-pre-wrap font-normal leading-6">{detail.customerConcern.trim()}</p>
          ) : null}
        </EntityDetailField>
        <EntityDetailField label="Inspection notes">
          {detail.inspectionNotes?.trim() ? (
            <p className="whitespace-pre-wrap font-normal leading-6">{detail.inspectionNotes.trim()}</p>
          ) : null}
        </EntityDetailField>
        <EntityDetailField label="Diagnosis">
          {detail.diagnosis?.trim() ? (
            <p className="whitespace-pre-wrap font-normal leading-6">{detail.diagnosis.trim()}</p>
          ) : null}
        </EntityDetailField>
        <EntityDetailField label="Work performed">
          {detail.workPerformed?.trim() ? (
            <p className="whitespace-pre-wrap font-normal leading-6">{detail.workPerformed.trim()}</p>
          ) : null}
        </EntityDetailField>
      </div>
    </EntityDetailSection>
  );
}

function statusTone(
  status: JobOrderDetail["status"],
): "neutral" | "success" | "warning" | "info" {
  if (status === "released" || status === "completed" || status === "paid") {
    return "success";
  }

  if (status === "cancelled") {
    return "warning";
  }

  if (
    status === "in_progress" ||
    status === "waiting_for_parts" ||
    status === "waiting_for_customer_approval"
  ) {
    return "info";
  }

  return "neutral";
}
