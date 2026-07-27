import type { QuickAccessWorkflowAction } from "@/features/quick-access/workflow";

const WORKFLOW_STATUS_LABELS: Record<QuickAccessWorkflowAction["state"], string> = {
  new_quotation: "No Quotation",
  continue_draft_quotation: "Draft Quotation",
  review_quotation: "Quotation Pending Approval",
  open_job_order: "Approved — Open Job Order",
  continue_job_order: "Job Order In Progress",
  open_billing: "Ready for Billing",
  view_service_history: "Completed",
};

export function formatQuickAccessWorkflowStatus(state: QuickAccessWorkflowAction["state"]) {
  return WORKFLOW_STATUS_LABELS[state];
}
