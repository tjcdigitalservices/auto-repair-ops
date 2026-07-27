import type { JobOrderStatus } from "@/features/job-orders/types";
import type { QuickAccessWorkflowAction } from "@/features/quick-access/workflow";

export type ArrivalSource = "manual" | "plate_scanner" | "quick_search";

export type ArrivalQueueStatus =
  | "waiting_intake"
  | "current_intake"
  | "draft_quotation"
  | "waiting_approval"
  | "job_order_in_progress"
  | "ready_for_billing"
  | "ready_for_release"
  | "completed";

export type ArrivalQueueFilter =
  | "all"
  | "waiting_intake"
  | "current_intake"
  | "in_progress"
  | "ready"
  | "completed";

export type ArrivalQueueItem = {
  id: string;
  customerId: string;
  vehicleId: string;
  customerName: string;
  vehicleLabel: string;
  plateNumber: string;
  arrivedAt: string;
  intakeStartedAt: string | null;
  lastActivityAt: string;
  arrivalSource: ArrivalSource;
  queueStatus: ArrivalQueueStatus;
  queueStatusLabel: string;
  primaryAction: QuickAccessWorkflowAction;
  intakeActionLabel: string;
};

export type ArrivalQueueSummary = {
  waiting: number;
  currentIntake: number;
  inService: number;
  ready: number;
  released: number;
};

export const ARRIVAL_QUEUE_STATUS_LABELS: Record<ArrivalQueueStatus, string> = {
  waiting_intake: "Waiting Intake",
  current_intake: "Current Intake",
  draft_quotation: "Draft Quotation",
  waiting_approval: "Waiting Approval",
  job_order_in_progress: "Job Order In Progress",
  ready_for_billing: "Ready for Billing",
  ready_for_release: "Ready for Release",
  completed: "Completed",
};

export function resolveArrivalQueueStatus(params: {
  workflowState: QuickAccessWorkflowAction["state"];
  jobOrderStatus: JobOrderStatus | null;
  isCurrentIntake: boolean;
  intakeStartedAt: string | null;
}): ArrivalQueueStatus {
  if (params.isCurrentIntake) {
    return "current_intake";
  }

  if (!params.intakeStartedAt && params.workflowState === "new_quotation") {
    return "waiting_intake";
  }

  switch (params.workflowState) {
    case "new_quotation":
      return params.intakeStartedAt ? "draft_quotation" : "waiting_intake";
    case "continue_draft_quotation":
      return "draft_quotation";
    case "review_quotation":
      return "waiting_approval";
    case "open_job_order":
      return "job_order_in_progress";
    case "continue_job_order":
      return "job_order_in_progress";
    case "open_billing":
      if (params.jobOrderStatus === "ready_for_billing") {
        return "ready_for_billing";
      }
      return "ready_for_billing";
    case "view_service_history":
      if (
        params.jobOrderStatus === "released" ||
        params.jobOrderStatus === "paid" ||
        params.jobOrderStatus === "completed"
      ) {
        return params.jobOrderStatus === "released" ? "ready_for_release" : "completed";
      }
      return "completed";
    default:
      return "waiting_intake";
  }
}

export function resolveArrivalCardPrimaryLabel(params: {
  queueStatus: ArrivalQueueStatus;
  primaryAction: QuickAccessWorkflowAction;
  isCurrentIntake: boolean;
}): string {
  if (params.isCurrentIntake || params.queueStatus === "current_intake") {
    return "Continue Intake";
  }

  if (params.queueStatus === "waiting_intake") {
    return "Start Intake";
  }

  switch (params.primaryAction.state) {
    case "continue_draft_quotation":
      return "Continue Quotation";
    case "review_quotation":
      return "Review Quotation";
    case "open_job_order":
      return "Open Job Order";
    case "continue_job_order":
      return "Continue Job Order";
    case "open_billing":
      return "Open Billing";
    case "view_service_history":
      return "View Service History";
    default:
      return params.primaryAction.label;
  }
}

export function matchesArrivalQueueFilter(
  status: ArrivalQueueStatus,
  filter: ArrivalQueueFilter,
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "waiting_intake") {
    return status === "waiting_intake";
  }

  if (filter === "current_intake") {
    return status === "current_intake";
  }

  if (filter === "in_progress") {
    return (
      status === "draft_quotation" ||
      status === "waiting_approval" ||
      status === "job_order_in_progress"
    );
  }

  if (filter === "ready") {
    return status === "ready_for_billing" || status === "ready_for_release";
  }

  return status === "completed";
}

export function summarizeArrivalQueue(items: ArrivalQueueItem[]): ArrivalQueueSummary {
  return items.reduce<ArrivalQueueSummary>(
    (summary, item) => {
      switch (item.queueStatus) {
        case "waiting_intake":
          summary.waiting += 1;
          break;
        case "current_intake":
          summary.currentIntake += 1;
          break;
        case "draft_quotation":
        case "waiting_approval":
        case "job_order_in_progress":
          summary.inService += 1;
          break;
        case "ready_for_billing":
        case "ready_for_release":
          summary.ready += 1;
          break;
        case "completed":
          summary.released += 1;
          break;
        default:
          break;
      }

      return summary;
    },
    { waiting: 0, currentIntake: 0, inService: 0, ready: 0, released: 0 },
  );
}

export function findNextWaitingArrival(items: ArrivalQueueItem[]) {
  return (
    items.find(
      (item) => item.queueStatus === "waiting_intake" && item.intakeActionLabel === "Start Intake",
    ) ?? items.find((item) => item.queueStatus === "waiting_intake") ?? null
  );
}
