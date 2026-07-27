import type { JobOrderStatus } from "@/features/job-orders/types";
import type { QuotationListItem, QuotationStatus } from "@/features/quotations/types";
import { buildQuotationNewHref } from "@/features/quotations/utils";

import type { QuickAccessPermissions } from "@/features/quick-access/types";
import { appendQuickAccessReturnTo } from "@/features/quick-access/intake/active-intake-session";

export type QuickAccessLinkedJobOrder = {
  id: string;
  quotationId: string;
  vehicleId: string;
  status: JobOrderStatus;
  invoiceId: string | null;
};

export type QuickAccessWorkflowAction = {
  label: string;
  href: string;
  state:
    | "new_quotation"
    | "continue_draft_quotation"
    | "review_quotation"
    | "open_job_order"
    | "continue_job_order"
    | "open_billing"
    | "view_service_history";
};

const TERMINAL_QUOTATION_STATUSES = new Set<QuotationStatus>(["rejected", "expired"]);

const IN_PROGRESS_JOB_ORDER_STATUSES = new Set<JobOrderStatus>([
  "pending",
  "in_progress",
  "waiting_for_parts",
  "waiting_for_customer_approval",
]);

export function findLatestActiveQuotationForVehicle(
  quotations: QuotationListItem[],
  vehicleId: string,
) {
  return [...quotations]
    .filter((quotation) => quotation.vehicleId === vehicleId)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .find((quotation) => !TERMINAL_QUOTATION_STATUSES.has(quotation.status)) ?? null;
}

export function resolveQuickAccessPrimaryAction(params: {
  customerId: string;
  vehicleId: string | null;
  recentQuotations: QuotationListItem[];
  jobOrdersByQuotationId: Map<string, QuickAccessLinkedJobOrder>;
  permissions: QuickAccessPermissions;
}): QuickAccessWorkflowAction {
  const { customerId, vehicleId, recentQuotations, jobOrdersByQuotationId, permissions } = params;

  if (!vehicleId) {
    return {
      label: "New Quotation",
      href: buildQuotationNewHref({ customerId }),
      state: "new_quotation",
    };
  }

  const latestQuotation = findLatestActiveQuotationForVehicle(recentQuotations, vehicleId);

  if (!latestQuotation) {
    return {
      label: "New Quotation",
      href: buildQuotationNewHref({ customerId, vehicleId }),
      state: "new_quotation",
    };
  }

  if (latestQuotation.status === "draft") {
    if (permissions.canCreateQuotations) {
      return {
        label: "Continue Draft Quotation",
        href: `/quotations/${latestQuotation.id}/edit`,
        state: "continue_draft_quotation",
      };
    }
  }

  if (latestQuotation.status === "pending_approval") {
    if (permissions.canViewQuotations) {
      return {
        label: "Review Quotation",
        href: `/quotations/${latestQuotation.id}`,
        state: "review_quotation",
      };
    }
  }

  if (latestQuotation.status === "approved") {
    const jobOrder = jobOrdersByQuotationId.get(latestQuotation.id) ?? null;

    if (!jobOrder) {
      if (permissions.canViewQuotations) {
        return {
          label: "Open Job Order",
          href: `/quotations/${latestQuotation.id}`,
          state: "open_job_order",
        };
      }
    } else if (permissions.canViewJobOrders) {
      if (IN_PROGRESS_JOB_ORDER_STATUSES.has(jobOrder.status)) {
        return {
          label: "Continue Job Order",
          href: `/job-orders/${jobOrder.id}`,
          state: "continue_job_order",
        };
      }

      if (jobOrder.status === "ready_for_billing") {
        return {
          label: "Open Billing",
          href: buildQuickAccessBillingHref(jobOrder),
          state: "open_billing",
        };
      }

      if (
        jobOrder.status === "completed" ||
        jobOrder.status === "paid" ||
        jobOrder.status === "released"
      ) {
        return {
          label: "View Service History",
          href: "#quick-access-service-history",
          state: "view_service_history",
        };
      }
    }
  }

  if (permissions.canCreateQuotations) {
    return {
      label: "New Quotation",
      href: buildQuotationNewHref({ customerId, vehicleId }),
      state: "new_quotation",
    };
  }

  if (permissions.canViewServiceHistory) {
    return {
      label: "View Service History",
      href: "#quick-access-service-history",
      state: "view_service_history",
    };
  }

  return {
    label: "View Customer",
    href: `/customers/${customerId}`,
    state: "view_service_history",
  };
}

function withIntakeReturnTo(action: QuickAccessWorkflowAction): QuickAccessWorkflowAction {
  return {
    ...action,
    href: appendQuickAccessReturnTo(action.href),
  };
}

export function resolveQuickAccessPrimaryActionWithIntakeContext(params: Parameters<
  typeof resolveQuickAccessPrimaryAction
>[0]): QuickAccessWorkflowAction {
  return withIntakeReturnTo(resolveQuickAccessPrimaryAction(params));
}

export function buildQuickAccessSecondaryActionsWithIntakeContext(params: Parameters<
  typeof buildQuickAccessSecondaryActions
>[0]): QuickAccessSecondaryAction[] {
  return buildQuickAccessSecondaryActions(params).map((action) => ({
    ...action,
    href: appendQuickAccessReturnTo(action.href),
  }));
}

export function buildQuickAccessBillingHref(jobOrder: Pick<QuickAccessLinkedJobOrder, "id" | "invoiceId">) {
  if (jobOrder.invoiceId) {
    return `/invoices/${jobOrder.invoiceId}`;
  }

  return `/job-orders/${jobOrder.id}?tab=billing`;
}

export type QuickAccessSecondaryAction = {
  label: string;
  href: string;
};

export function buildQuickAccessSecondaryActions(params: {
  customerId: string;
  customerDisplayName: string;
  vehicleId: string | null;
  permissions: QuickAccessPermissions;
}): QuickAccessSecondaryAction[] {
  const actions: QuickAccessSecondaryAction[] = [
    {
      label: "View Customer",
      href: `/customers/${params.customerId}`,
    },
  ];

  if (params.vehicleId) {
    actions.push({
      label: "View Vehicle",
      href: `/vehicles/${params.vehicleId}`,
    });
  }

  if (params.permissions.canViewQuotations) {
    actions.push({
      label: "View Quotations",
      href: `/quotations?search=${encodeURIComponent(params.customerDisplayName)}`,
    });
  }

  if (params.permissions.canViewServiceHistory) {
    actions.push({
      label: "View Service History",
      href: "#quick-access-service-history",
    });
  }

  return actions;
}
