import type {
  PayrollEmployeeActionItem,
  PayrollIssueSeverity,
  PayrollIssueSummary,
  PayrollIssueType,
  PayrollLifecycleStatus,
  PayrollLockValidationResult,
  PayrollPeriodDetailSummary,
  PayrollPeriodItemSummary,
  PayrollPeriodStatus,
  PayrollPeriodSummary,
  PayrollReviewQuickFilter,
  PayrollWorkflowStep,
} from "@/features/payroll/types";
import {
  isBlockedPayrollStaffSummary,
  itemNeedsPayrollReview,
  resolvePayrollReviewStatus,
} from "@/features/payroll/utils";

/** Minutes worked beyond this threshold flags excessive overtime (warning). */
export const EXCESSIVE_OVERTIME_MINUTES = 1200;

const BLOCKING_ISSUE_TYPES = new Set<PayrollIssueType>([
  "missing_dtr",
  "missing_salary_rate",
  "missing_employment_type",
  "negative_payroll",
  "invalid_attendance",
]);

export function itemHasPayrollIssue(
  item: PayrollPeriodItemSummary,
  issueType: PayrollIssueType,
): boolean {
  switch (issueType) {
    case "missing_dtr":
      return (
        item.readinessStatus === "needs_dtr_completion" ||
        item.warningCodes.includes("needs_dtr_completion") ||
        item.missingTimeoutCount > 0
      );
    case "missing_salary_rate":
      return (
        item.readinessStatus === "missing_compensation" ||
        item.warningCodes.includes("missing_compensation")
      );
    case "missing_employment_type":
      return item.readinessStatus === "not_configured" || item.payBasis === null;
    case "negative_payroll":
      return item.netPay < 0;
    case "invalid_attendance":
      return (
        item.readinessStatus === "missing_attendance" ||
        item.warningCodes.includes("missing_attendance")
      );
    case "manual_adjustments":
      return item.adjustments.length > 0;
    case "excessive_overtime":
      return item.overtimeMinutes >= EXCESSIVE_OVERTIME_MINUTES;
    case "holiday_overrides":
      return item.warningCodes.includes("custom_holiday_rule");
    case "missing_leave_configuration":
      return item.warningCodes.includes("worked_during_approved_leave");
    default:
      return false;
  }
}

const ISSUE_DEFINITIONS: Array<{
  type: PayrollIssueType;
  label: string;
  severity: PayrollIssueSeverity;
  actionLabel: string;
  filter: PayrollReviewQuickFilter;
}> = [
  {
    type: "missing_dtr",
    label: "Missing DTR",
    severity: "blocking",
    actionLabel: "Review Attendance",
    filter: "missing_dtr",
  },
  {
    type: "missing_salary_rate",
    label: "Missing Salary Rate",
    severity: "blocking",
    actionLabel: "Open Compensation Setup",
    filter: "missing_salary_rate",
  },
  {
    type: "missing_employment_type",
    label: "Missing Employment Type",
    severity: "blocking",
    actionLabel: "Configure Employee",
    filter: "missing_salary_rate",
  },
  {
    type: "negative_payroll",
    label: "Negative Payroll",
    severity: "blocking",
    actionLabel: "Review Payroll",
    filter: "blocking_issues",
  },
  {
    type: "invalid_attendance",
    label: "Invalid Attendance",
    severity: "blocking",
    actionLabel: "Review Attendance",
    filter: "missing_dtr",
  },
  {
    type: "manual_adjustments",
    label: "Manual Adjustments",
    severity: "warning",
    actionLabel: "Review Adjustments",
    filter: "manual_adjustments",
  },
  {
    type: "excessive_overtime",
    label: "Excessive Overtime",
    severity: "warning",
    actionLabel: "Review Overtime",
    filter: "overtime",
  },
  {
    type: "holiday_overrides",
    label: "Holiday Overrides",
    severity: "warning",
    actionLabel: "Review Holiday Pay",
    filter: "holiday_pay",
  },
  {
    type: "missing_leave_configuration",
    label: "Missing Leave Configuration",
    severity: "warning",
    actionLabel: "Review Leave",
    filter: "warnings",
  },
];

const ISSUE_EXPLANATIONS: Record<PayrollIssueType, string> = {
  missing_dtr: "Attendance is incomplete.",
  missing_salary_rate: "Payroll cannot be calculated.",
  missing_employment_type: "Employment type is not configured.",
  negative_payroll: "Net pay is negative and must be corrected.",
  invalid_attendance: "Attendance records are invalid.",
  manual_adjustments: "Manual adjustments need review.",
  excessive_overtime: "Overtime exceeds the review threshold.",
  holiday_overrides: "Holiday pay rules were overridden.",
  missing_leave_configuration: "Leave configuration needs review.",
};

function resolveEmployeeIssueAction(
  issueType: PayrollIssueType,
  employeeName: string,
  periodId: string,
  itemId: string,
): { label: string; href: string } {
  const encodedName = encodeURIComponent(employeeName);

  switch (issueType) {
    case "missing_dtr":
    case "invalid_attendance":
      return { label: "Review Attendance", href: "/attendance" };
    case "missing_salary_rate":
      return {
        label: "Configure Salary",
        href: `/payroll?tab=compensation&staffSearch=${encodedName}`,
      };
    case "missing_employment_type":
      return {
        label: "Configure Employee",
        href: `/payroll?tab=compensation&staffSearch=${encodedName}`,
      };
    case "negative_payroll":
      return { label: "Review Payroll", href: `#payroll-item-${itemId}` };
    case "manual_adjustments":
      return { label: "Review Adjustments", href: `#payroll-item-${itemId}` };
    case "excessive_overtime":
      return { label: "Review Overtime", href: "/attendance" };
    case "holiday_overrides":
      return { label: "Review Holiday Pay", href: "/attendance" };
    case "missing_leave_configuration":
      return { label: "Review Leave", href: "/attendance" };
    default:
      return { label: "Review", href: `/payroll/${periodId}` };
  }
}

const PRIMARY_ISSUE_PRIORITY: PayrollIssueType[] = [
  "missing_dtr",
  "invalid_attendance",
  "missing_salary_rate",
  "missing_employment_type",
  "negative_payroll",
  "manual_adjustments",
  "excessive_overtime",
  "holiday_overrides",
  "missing_leave_configuration",
];

function buildEmployeeActionItem(
  item: PayrollPeriodItemSummary,
  definition: (typeof ISSUE_DEFINITIONS)[number],
  periodId: string,
): PayrollEmployeeActionItem {
  const action = resolveEmployeeIssueAction(
    definition.type,
    item.fullName,
    periodId,
    item.id,
  );

  return {
    id: `${item.id}:${definition.type}`,
    itemId: item.id,
    staffId: item.staffId,
    employeeName: item.fullName,
    issueType: definition.type,
    issueLabel: definition.label,
    explanation: ISSUE_EXPLANATIONS[definition.type],
    severity: definition.severity,
    actionLabel: action.label,
    actionHref: action.href,
  };
}

export function resolvePrimaryEmployeeActionItem(
  item: PayrollPeriodItemSummary,
  periodId: string,
): PayrollEmployeeActionItem | null {
  for (const issueType of PRIMARY_ISSUE_PRIORITY) {
    if (!itemHasPayrollIssue(item, issueType)) {
      continue;
    }

    const definition = ISSUE_DEFINITIONS.find((entry) => entry.type === issueType);

    if (!definition) {
      continue;
    }

    return buildEmployeeActionItem(item, definition, periodId);
  }

  return null;
}

export function computePrimaryEmployeeActionItems(
  items: PayrollPeriodItemSummary[],
  periodId: string,
): PayrollEmployeeActionItem[] {
  return items
    .map((item) => resolvePrimaryEmployeeActionItem(item, periodId))
    .filter((item): item is PayrollEmployeeActionItem => item !== null)
    .sort((left, right) => {
      if (left.severity !== right.severity) {
        return left.severity === "blocking" ? -1 : 1;
      }

      return left.employeeName.localeCompare(right.employeeName);
    });
}

export function countEmployeesWithBlockingIssues(
  items: PayrollPeriodItemSummary[],
  periodId: string,
): number {
  return computePrimaryEmployeeActionItems(items, periodId).filter(
    (item) => item.severity === "blocking",
  ).length;
}

export function computePayrollEmployeeActionItems(
  items: PayrollPeriodItemSummary[],
  periodId: string,
): PayrollEmployeeActionItem[] {
  const actionItems: PayrollEmployeeActionItem[] = [];

  for (const item of items) {
    for (const definition of ISSUE_DEFINITIONS) {
      if (!itemHasPayrollIssue(item, definition.type)) {
        continue;
      }

      const action = resolveEmployeeIssueAction(
        definition.type,
        item.fullName,
        periodId,
        item.id,
      );

      actionItems.push({
        id: `${item.id}:${definition.type}`,
        itemId: item.id,
        staffId: item.staffId,
        employeeName: item.fullName,
        issueType: definition.type,
        issueLabel: definition.label,
        explanation: ISSUE_EXPLANATIONS[definition.type],
        severity: definition.severity,
        actionLabel: action.label,
        actionHref: action.href,
      });
    }
  }

  return actionItems.sort((left, right) => {
    if (left.severity !== right.severity) {
      return left.severity === "blocking" ? -1 : 1;
    }

    return left.employeeName.localeCompare(right.employeeName);
  });
}

/** @deprecated Use countEmployeesWithBlockingIssues for CTA labels */
export function countBlockingEmployeeActionItems(items: PayrollEmployeeActionItem[]) {
  return items.filter((item) => item.severity === "blocking").length;
}

export function computePayrollIssues(items: PayrollPeriodItemSummary[]): PayrollIssueSummary[] {
  return ISSUE_DEFINITIONS.flatMap((definition) => {
    const affectedStaffIds = items
      .filter((item) => itemHasPayrollIssue(item, definition.type))
      .map((item) => item.staffId);

    if (affectedStaffIds.length === 0) {
      return [];
    }

    return [
      {
        type: definition.type,
        label: definition.label,
        severity: definition.severity,
        affectedCount: affectedStaffIds.length,
        affectedStaffIds,
        actionLabel: definition.actionLabel,
        filter: definition.filter,
      },
    ];
  });
}

export function countBlockingPayrollIssues(issues: PayrollIssueSummary[]) {
  return issues.filter((issue) => issue.severity === "blocking").length;
}

export function computePayrollLockValidation(
  items: PayrollPeriodItemSummary[],
  summary: PayrollPeriodDetailSummary,
): PayrollLockValidationResult {
  const issues = computePayrollIssues(items);
  const blockingIssues = issues.filter((issue) => issue.severity === "blocking");
  const warningIssues = issues.filter((issue) => issue.severity === "warning");

  const checks = [
    {
      id: "salary_rates",
      label: "Salary rates configured",
      passed: summary.missingSalaryRateCount === 0 && summary.missingCompensationCount === 0,
      severity: "blocking" as const,
    },
    {
      id: "attendance",
      label: "Attendance complete",
      passed:
        summary.missingDtrCount === 0 &&
        summary.missingAttendanceCount === 0 &&
        summary.openShiftCount === 0,
      severity: "blocking" as const,
    },
    {
      id: "totals",
      label: "Payroll totals calculated",
      passed: summary.totalStaffCount > 0 && summary.totalNetPay >= 0,
      severity: "blocking" as const,
    },
    {
      id: "manual_adjustments",
      label: "Manual adjustments",
      passed: !issues.some((issue) => issue.type === "manual_adjustments"),
      severity: "warning" as const,
    },
    {
      id: "holiday_overrides",
      label: "Holiday overrides",
      passed: !issues.some((issue) => issue.type === "holiday_overrides"),
      severity: "warning" as const,
    },
    {
      id: "excessive_overtime",
      label: "Excessive overtime",
      passed: !issues.some((issue) => issue.type === "excessive_overtime"),
      severity: "warning" as const,
    },
  ];

  return {
    canLock: blockingIssues.length === 0 && summary.totalStaffCount > 0,
    blockingIssueCount: blockingIssues.reduce((total, issue) => total + issue.affectedCount, 0),
    blockingIssueTypes: blockingIssues.length,
    warningIssueTypes: warningIssues.length,
    checks,
    issues,
  };
}

export function resolvePayrollLifecycleStatus(params: {
  period: PayrollPeriodSummary;
  summary: PayrollPeriodDetailSummary;
  hasGeneratedCut: boolean;
  blockingIssueCount: number;
}): PayrollLifecycleStatus {
  const { period, summary, hasGeneratedCut, blockingIssueCount } = params;

  if (period.status === "finalized") {
    return "payslips_generated";
  }

  if (period.status === "processing") {
    return "locked";
  }

  if (!hasGeneratedCut) {
    return "draft";
  }

  if (blockingIssueCount > 0 || summary.needsReviewCount > 0) {
    return "reviewing";
  }

  return "ready_to_lock";
}

export function resolvePayrollWorkflowStep(params: {
  period: PayrollPeriodSummary;
  hasGeneratedCut: boolean;
  blockingIssueCount: number;
  needsReviewCount: number;
}): PayrollWorkflowStep {
  const { period, hasGeneratedCut, blockingIssueCount, needsReviewCount } = params;

  if (period.status === "finalized") {
    return "generate_payslips";
  }

  if (period.status === "processing") {
    return "generate_payslips";
  }

  if (!hasGeneratedCut) {
    return "generate";
  }

  if (blockingIssueCount > 0) {
    return "resolve_issues";
  }

  if (needsReviewCount > 0) {
    return "review";
  }

  return "lock_payroll";
}

export function formatPayrollLifecycleStatusLabel(status: PayrollLifecycleStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "reviewing":
      return "Reviewing";
    case "ready_to_lock":
      return "Ready to Lock";
    case "locked":
      return "Locked";
    case "payslips_generated":
      return "Payslips Generated";
    case "paid":
      return "Paid";
  }
}

export function getPayrollLifecycleStatusTone(status: PayrollLifecycleStatus) {
  switch (status) {
    case "draft":
      return "neutral";
    case "reviewing":
      return "warning";
    case "ready_to_lock":
      return "info";
    case "locked":
      return "warning";
    case "payslips_generated":
      return "success";
    case "paid":
      return "success";
  }
}

export type PayrollEmployeeWorkflowStatus =
  | "ready"
  | "missing_dtr"
  | "missing_salary_rate"
  | "manual_review"
  | "blocked"
  | "locked"
  | "paid";

export function resolvePayrollEmployeeWorkflowStatus(
  item: PayrollPeriodItemSummary,
  periodStatus: PayrollPeriodStatus,
): PayrollEmployeeWorkflowStatus {
  if (periodStatus === "processing" || periodStatus === "finalized") {
    return "locked";
  }

  const reviewStatus = resolvePayrollReviewStatus(item);

  if (reviewStatus === "ready") {
    return "ready";
  }

  if (reviewStatus === "missing_dtr") {
    return "missing_dtr";
  }

  if (reviewStatus === "missing_salary_rate") {
    return "missing_salary_rate";
  }

  if (reviewStatus === "manual_review") {
    return "manual_review";
  }

  if (isBlockedPayrollStaffSummary(item) || itemNeedsPayrollReview(item)) {
    return "blocked";
  }

  return "blocked";
}

export function formatPayrollEmployeeWorkflowStatusLabel(status: PayrollEmployeeWorkflowStatus) {
  switch (status) {
    case "ready":
      return "Ready";
    case "missing_dtr":
      return "Missing DTR";
    case "missing_salary_rate":
      return "Missing Salary Rate";
    case "manual_review":
      return "Manual Review";
    case "blocked":
      return "Blocked";
    case "locked":
      return "Locked";
    case "paid":
      return "Paid";
  }
}

export function getPayrollEmployeeWorkflowStatusTone(status: PayrollEmployeeWorkflowStatus) {
  switch (status) {
    case "ready":
      return "success";
    case "manual_review":
      return "warning";
    case "missing_dtr":
    case "missing_salary_rate":
    case "blocked":
      return "destructive";
    case "locked":
      return "neutral";
    case "paid":
      return "success";
  }
}

export function isBlockingPayrollIssueType(type: PayrollIssueType) {
  return BLOCKING_ISSUE_TYPES.has(type);
}
