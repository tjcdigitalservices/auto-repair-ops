import {
  JOB_ORDER_DETAIL_TABS,
  type JobOrderDetail,
  type JobOrderDetailTab,
  type JobOrderItemDetail,
  type JobOrderItemInventoryTracking,
  type JobOrderPartUsageEntry,
  type JobOrderStatus,
  type SimplifiedJobOrderStatus,
} from "@/features/job-orders/types";
import type { StaffRole } from "@/lib/auth/permissions";
import { roundCurrency } from "@/lib/currency";

const FINAL_MECHANIC_LOCKED_STATUSES: JobOrderStatus[] = [
  "completed",
  "ready_for_billing",
  "paid",
  "released",
  "cancelled",
];

const FINAL_ITEM_LOCKED_STATUSES: JobOrderStatus[] = [
  "completed",
  "ready_for_billing",
  "paid",
  "released",
  "cancelled",
];

const DETAIL_LOCKED_STATUSES: JobOrderStatus[] = ["released", "cancelled"];

const NON_DELETABLE_JOB_ORDER_STATUSES: JobOrderStatus[] = [
  "completed",
  "ready_for_billing",
  "paid",
  "released",
];

export const JOB_ORDER_STATUS_WORKFLOW: JobOrderStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "released",
  "cancelled",
];

const SIMPLIFIED_JOB_ORDER_STATUS_LABELS: Record<SimplifiedJobOrderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  released: "Released",
  cancelled: "Cancelled",
};

const SIMPLIFIED_JOB_ORDER_STATUS_DESCRIPTIONS: Record<SimplifiedJobOrderStatus, string> = {
  pending: "Job created but work has not started.",
  in_progress: "Vehicle is currently being worked on.",
  completed: "Work has been completed.",
  released: "Vehicle has been released to the customer.",
  cancelled: "This job order was cancelled.",
};

export function getSimplifiedJobOrderStatus(
  status: JobOrderStatus,
): SimplifiedJobOrderStatus {
  switch (status) {
    case "waiting_for_parts":
    case "waiting_for_customer_approval":
      return "in_progress";
    case "ready_for_billing":
    case "paid":
      return "completed";
    default:
      return status;
  }
}

export function formatJobOrderStatus(status: JobOrderStatus) {
  return SIMPLIFIED_JOB_ORDER_STATUS_LABELS[getSimplifiedJobOrderStatus(status)];
}

export function getJobOrderStatusDescription(status: JobOrderStatus) {
  return SIMPLIFIED_JOB_ORDER_STATUS_DESCRIPTIONS[getSimplifiedJobOrderStatus(status)];
}

export function getJobOrderPrimaryActionConfig(
  simplifiedStatus: SimplifiedJobOrderStatus,
  canUpdateStatus: boolean,
):
  | {
      label: string;
      nextStatus: JobOrderStatus;
      pendingLabel: string;
    }
  | null {
  if (!canUpdateStatus) {
    return null;
  }

  if (simplifiedStatus === "pending") {
    return {
      label: "Start Job",
      nextStatus: "in_progress",
      pendingLabel: "Starting...",
    };
  }

  if (simplifiedStatus === "in_progress") {
    return {
      label: "Mark Completed",
      nextStatus: "completed",
      pendingLabel: "Completing...",
    };
  }

  return null;
}

export function toTitleCaseWords(value: string) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}

export function resolveJobOrderDetailTab(value: string | undefined): JobOrderDetailTab {
  return JOB_ORDER_DETAIL_TABS.includes(value as JobOrderDetailTab)
    ? (value as JobOrderDetailTab)
    : "overview";
}

export type JobOrderWorkflowTimelineStepState = "completed" | "current" | "pending";

export type JobOrderWorkflowTimelineStep = {
  id: string;
  label: string;
  state: JobOrderWorkflowTimelineStepState;
  timestamp: string | null;
};

const JOB_ORDER_WORKFLOW_STAGES = [
  { id: "created", label: "Created" },
  { id: "quotation_approved", label: "Quotation Approved" },
  { id: "in_progress", label: "In Progress" },
  { id: "ready_for_billing", label: "Ready for Billing" },
  { id: "completed", label: "Completed" },
] as const;

function resolveJobOrderWorkflowProgress(params: {
  status: JobOrderStatus;
  startedAt: string | null;
  completedAt: string | null;
  releasedAt: string | null;
  quotationId: string | null;
  quotationApprovedAt: string | null;
  invoiceId: string | null;
}) {
  const quotationApprovedReached =
    !params.quotationId || params.quotationApprovedAt !== null;

  if (params.status === "cancelled") {
    let completedThrough = 0;

    if (quotationApprovedReached) {
      completedThrough = 1;
    }

    if (params.startedAt) {
      completedThrough = 2;
    }

    if (params.completedAt) {
      completedThrough = 3;
    }

    if (params.releasedAt) {
      completedThrough = 4;
    }

    return { completedThrough, currentIndex: null as number | null };
  }

  switch (params.status) {
    case "pending":
      return {
        completedThrough: quotationApprovedReached ? 1 : 0,
        currentIndex: null,
      };
    case "in_progress":
    case "waiting_for_parts":
    case "waiting_for_customer_approval":
      return { completedThrough: 1, currentIndex: 2 };
    case "completed":
      return {
        completedThrough: params.invoiceId ? 3 : 2,
        currentIndex: params.invoiceId ? 4 : 3,
      };
    case "ready_for_billing":
      return { completedThrough: 3, currentIndex: 4 };
    case "paid":
    case "released":
      return { completedThrough: 4, currentIndex: null };
    default:
      return { completedThrough: 0, currentIndex: null };
  }
}

function resolveJobOrderWorkflowStageTimestamp(
  stageId: (typeof JOB_ORDER_WORKFLOW_STAGES)[number]["id"],
  params: {
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    releasedAt: string | null;
    quotationId: string | null;
    quotationApprovedAt: string | null;
    invoiceStatus: JobOrderDetail["invoiceStatus"];
  },
) {
  switch (stageId) {
    case "created":
      return params.createdAt;
    case "quotation_approved":
      return params.quotationApprovedAt ?? (!params.quotationId ? params.createdAt : null);
    case "in_progress":
      return params.startedAt;
    case "ready_for_billing":
      return params.completedAt;
    case "completed":
      return params.releasedAt ?? (params.invoiceStatus === "paid" ? params.completedAt : null);
    default:
      return null;
  }
}

export function buildJobOrderWorkflowTimeline(params: {
  status: JobOrderStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  releasedAt: string | null;
  quotationId: string | null;
  quotationApprovedAt: string | null;
  invoiceId: string | null;
  invoiceStatus: JobOrderDetail["invoiceStatus"];
}): JobOrderWorkflowTimelineStep[] {
  const { completedThrough, currentIndex } = resolveJobOrderWorkflowProgress(params);

  return JOB_ORDER_WORKFLOW_STAGES.map((stage, index) => {
    let state: JobOrderWorkflowTimelineStepState = "pending";

    if (index <= completedThrough) {
      state = "completed";
    }

    if (currentIndex !== null && index === currentIndex) {
      state = "current";
    }

    const timestamp =
      state === "pending"
        ? null
        : resolveJobOrderWorkflowStageTimestamp(stage.id, params);

    return {
      id: stage.id,
      label: stage.label,
      state,
      timestamp,
    };
  });
}

export function getAllowedJobOrderStatusTransitions(
  status: JobOrderStatus,
  _options?: {
    invoiceId?: string | null;
    requireInvoiceBeforeJobCompletion?: boolean;
  },
): JobOrderStatus[] {
  switch (status) {
    case "pending":
      return ["in_progress", "cancelled"];
    case "in_progress":
    case "waiting_for_parts":
    case "waiting_for_customer_approval":
      return ["completed", "cancelled"];
    default:
      return [];
  }
}

export function canEditJobOrderDetails(status: JobOrderStatus) {
  return !DETAIL_LOCKED_STATUSES.includes(status);
}

export function canAssignMechanics(status: JobOrderStatus) {
  return !FINAL_MECHANIC_LOCKED_STATUSES.includes(status);
}

export function canAddAdditionalItems(status: JobOrderStatus) {
  return !FINAL_ITEM_LOCKED_STATUSES.includes(status);
}

export function canEditJobOrderItems(status: JobOrderStatus) {
  return !FINAL_ITEM_LOCKED_STATUSES.includes(status);
}

export function canUpdateJobOrderChecklist(status: JobOrderStatus) {
  return !["released", "cancelled"].includes(status);
}

export function canResolveAdditionalItems(status: JobOrderStatus) {
  return !FINAL_ITEM_LOCKED_STATUSES.includes(status);
}

export function jobOrderHasUsedParts(
  items: Pick<JobOrderItemDetail, "usageStatus">[],
) {
  return items.some((item) => item.usageStatus === "used");
}

export function canDeleteJobOrder(params: {
  isHistorical?: boolean;
  status: JobOrderStatus;
  hasInvoice: boolean;
  items: Pick<JobOrderItemDetail, "usageStatus">[];
}) {
  if (params.isHistorical) {
    return false;
  }

  if (params.hasInvoice) {
    return false;
  }

  if (NON_DELETABLE_JOB_ORDER_STATUSES.includes(params.status)) {
    return false;
  }

  return !jobOrderHasUsedParts(params.items);
}

export function canDeleteJobOrdersByRole(role: StaffRole) {
  return role === "owner" || role === "admin" || role === "service_advisor";
}

export function canGenerateJobOrderInvoice(status: JobOrderStatus, invoiceId: string | null) {
  const simplifiedStatus = getSimplifiedJobOrderStatus(status);

  return ["completed", "released"].includes(simplifiedStatus) && invoiceId === null;
}

export function canReleaseJobOrderVehicle(params: {
  status: JobOrderStatus;
  invoiceId: string | null;
  invoiceStatus: "unpaid" | "partially_paid" | "paid" | "cancelled" | null;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  requireInvoiceBeforeVehicleRelease: boolean;
  releasedAt: string | null;
}) {
  const eligibleStatus =
    getSimplifiedJobOrderStatus(params.status) === "completed" &&
    params.status !== "released" &&
    params.status !== "cancelled" &&
    params.releasedAt === null;

  if (!eligibleStatus) {
    return false;
  }

  const hasActiveInvoice =
    params.invoiceId !== null && params.invoiceStatus !== null && params.invoiceStatus !== "cancelled";

  if (!hasActiveInvoice) {
    return !params.requireInvoiceBeforeVehicleRelease;
  }

  if (
    params.invoiceStatus !== "paid" &&
    (params.requireFullPaymentBeforeRelease || !params.allowReleaseWithBalance)
  ) {
    return false;
  }

  return true;
}

export const ACTIVE_JOB_ORDER_STATUSES: JobOrderStatus[] = [
  "pending",
  "in_progress",
  "waiting_for_parts",
  "waiting_for_customer_approval",
  "completed",
  "ready_for_billing",
];

export function expandJobOrderStatusFilter(
  status: JobOrderStatus | "active",
): JobOrderStatus[] {
  switch (status) {
    case "active":
      return ACTIVE_JOB_ORDER_STATUSES;
    case "in_progress":
      return ["in_progress", "waiting_for_parts", "waiting_for_customer_approval"];
    case "completed":
      return ["completed", "ready_for_billing", "paid"];
    default:
      return [status];
  }
}

export function calculateJobOrderBillableTotal(items: JobOrderItemDetail[]) {
  return roundCurrency(
    items
      .filter((item) => item.approvalStatus === "not_required" || item.approvalStatus === "approved")
      .reduce((sum, item) => sum + item.total, 0),
  );
}

export function calculateJobOrderPendingApprovalCount(items: JobOrderItemDetail[]) {
  return items.filter((item) => item.isAdditional && item.approvalStatus === "pending").length;
}

export function calculateJobOrderPendingApprovalTotal(items: JobOrderItemDetail[]) {
  return roundCurrency(
    items
      .filter((item) => item.isAdditional && item.approvalStatus === "pending")
      .reduce((sum, item) => sum + item.total, 0),
  );
}

export function calculateJobOrderRejectedAdditionalTotal(items: JobOrderItemDetail[]) {
  return roundCurrency(
    items
      .filter((item) => item.isAdditional && item.approvalStatus === "rejected")
      .reduce((sum, item) => sum + item.total, 0),
  );
}

export function mapJobOrderDetailCapabilities(
  detail: Omit<JobOrderDetail, keyof ReturnType<typeof buildJobOrderDetailCapabilities>>,
  params: {
    canUpdateChecklistRole: boolean;
    canUpdateStatusRole: boolean;
    canManageBillingRole: boolean;
  },
) {
  return {
    ...detail,
    ...buildJobOrderDetailCapabilities({
      isHistorical: detail.isHistorical,
      status: detail.status,
      invoiceId: detail.invoiceId,
      invoiceStatus: detail.invoiceStatus,
      allowReleaseWithBalance: detail.allowReleaseWithBalance,
      requireFullPaymentBeforeRelease: detail.requireFullPaymentBeforeRelease,
      requireInvoiceBeforeJobCompletion: detail.requireInvoiceBeforeJobCompletion,
      requireInvoiceBeforeVehicleRelease: detail.requireInvoiceBeforeVehicleRelease,
      releasedAt: detail.releasedAt,
      canUpdateChecklistRole: params.canUpdateChecklistRole,
      canUpdateStatusRole: params.canUpdateStatusRole,
      canManageBillingRole: params.canManageBillingRole,
    }),
  };
}

export function toNumeric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildJobOrderItemInventoryTracking(params: {
  plannedQuantity: number;
  hasStockRecord: boolean;
  quantityOnHand: number | null;
  availableQuantity: number | null;
  reorderLevel: number | null;
  shelfLocation: string | null;
  usageHistory: JobOrderPartUsageEntry[];
}): JobOrderItemInventoryTracking {
  const usedQuantity = roundQuantity(
    params.usageHistory
      .filter((entry) => entry.usageType === "use")
      .reduce((sum, entry) => sum + entry.quantity, 0),
  );
  const returnedQuantity = roundQuantity(
    params.usageHistory
      .filter((entry) => entry.usageType === "return")
      .reduce((sum, entry) => sum + entry.quantity, 0),
  );
  const netUsedQuantity = roundQuantity(usedQuantity - returnedQuantity);
  const remainingUsageQuantity = roundQuantity(Math.max(params.plannedQuantity - netUsedQuantity, 0));

  return {
    hasStockRecord: params.hasStockRecord,
    quantityOnHand: params.quantityOnHand,
    availableQuantity: params.availableQuantity,
    reorderLevel: params.reorderLevel,
    shelfLocation: params.shelfLocation,
    isLowStock:
      params.availableQuantity !== null &&
      params.reorderLevel !== null &&
      params.availableQuantity <= params.reorderLevel,
    usedQuantity,
    returnedQuantity,
    netUsedQuantity,
    remainingUsageQuantity,
    usageHistory: params.usageHistory,
  };
}

export function isJobOrderChecklistRequired(item: JobOrderItemDetail) {
  return item.approvalStatus === "approved" || item.approvalStatus === "not_required";
}

export function getJobOrderChecklistStatus(item: JobOrderItemDetail) {
  if (item.approvalStatus === "pending") {
    return {
      label: "Pending approval",
      variant: "warning" as const,
      actionable: false,
    };
  }

  if (item.approvalStatus === "rejected") {
    return {
      label: "Rejected",
      variant: "destructive" as const,
      actionable: false,
    };
  }

  if (item.checklistCompleted) {
    return {
      label: "Completed",
      variant: "success" as const,
      actionable: true,
    };
  }

  return {
    label: "Open",
    variant: "neutral" as const,
    actionable: true,
  };
}

export function calculateJobOrderChecklistSummary(items: JobOrderItemDetail[]) {
  const requiredItems = items.filter(isJobOrderChecklistRequired);
  const completedRequiredItems = requiredItems.filter((item) => item.checklistCompleted);

  return {
    requiredCount: requiredItems.length,
    completedCount: completedRequiredItems.length,
    blockedCount: items.length - requiredItems.length,
    allRequiredCompleted:
      requiredItems.length > 0 && completedRequiredItems.length === requiredItems.length,
  };
}

export function groupJobOrderChecklistItems(items: JobOrderItemDetail[]) {
  return [
    {
      key: "service-labor",
      label: "Services / Labor",
      items: items.filter(
        (item) => item.itemType === "service" || item.itemType === "labor",
      ),
    },
    {
      key: "parts-products",
      label: "Parts / Products",
      items: items.filter((item) => item.itemType === "product"),
    },
  ] as const;
}

function buildJobOrderDetailCapabilities(params: {
  isHistorical: boolean;
  status: JobOrderStatus;
  invoiceId: string | null;
  invoiceStatus: "unpaid" | "partially_paid" | "paid" | "cancelled" | null;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  requireInvoiceBeforeJobCompletion: boolean;
  requireInvoiceBeforeVehicleRelease: boolean;
  releasedAt: string | null;
  canUpdateChecklistRole: boolean;
  canUpdateStatusRole: boolean;
  canManageBillingRole: boolean;
}) {
  if (params.isHistorical) {
    return {
      canEditDetails: false,
      canEditItems: false,
      canAssignMechanics: false,
      canAddAdditionalItems: false,
      canResolveAdditionalItems: false,
      canUpdateChecklist: false,
      canUpdateStatus: false,
      canGenerateInvoice: false,
      canReleaseVehicle: false,
      availableNextStatuses: [],
    };
  }

  return {
    canEditDetails: canEditJobOrderDetails(params.status),
    canEditItems: canEditJobOrderItems(params.status),
    canAssignMechanics: canAssignMechanics(params.status),
    canAddAdditionalItems: canAddAdditionalItems(params.status),
    canResolveAdditionalItems: canResolveAdditionalItems(params.status),
    canUpdateChecklist:
      params.canUpdateChecklistRole && canUpdateJobOrderChecklist(params.status),
    canUpdateStatus: params.canUpdateStatusRole,
    canGenerateInvoice:
      params.canManageBillingRole &&
      canGenerateJobOrderInvoice(params.status, params.invoiceId),
    canReleaseVehicle:
      params.canManageBillingRole &&
      canReleaseJobOrderVehicle({
        status: params.status,
        invoiceId: params.invoiceId,
        invoiceStatus: params.invoiceStatus,
        allowReleaseWithBalance: params.allowReleaseWithBalance,
        requireFullPaymentBeforeRelease: params.requireFullPaymentBeforeRelease,
        requireInvoiceBeforeVehicleRelease: params.requireInvoiceBeforeVehicleRelease,
        releasedAt: params.releasedAt,
      }),
    availableNextStatuses: params.canUpdateStatusRole
      ? getAllowedJobOrderStatusTransitions(params.status, {
          invoiceId: params.invoiceId,
          requireInvoiceBeforeJobCompletion:
            params.requireInvoiceBeforeJobCompletion,
        })
      : [],
  };
}
function roundQuantity(value: number) {
  return Number(value.toFixed(4));
}
