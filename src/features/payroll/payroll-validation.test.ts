import { describe, expect, it } from "vitest";

import type { PayrollPeriodItemSummary } from "@/features/payroll/types";
import {
  computePayrollEmployeeActionItems,
  computePayrollIssues,
  computePayrollLockValidation,
  computePrimaryEmployeeActionItems,
  countEmployeesWithBlockingIssues,
  itemHasPayrollIssue,
  resolvePayrollEmployeeWorkflowStatus,
  resolvePayrollLifecycleStatus,
  resolvePrimaryEmployeeActionItem,
} from "@/features/payroll/payroll-validation";
import { summarizePayrollReviewItems } from "@/features/payroll/utils";

function buildItem(
  overrides: Partial<PayrollPeriodItemSummary> = {},
): PayrollPeriodItemSummary {
  return {
    id: "item-1",
    payrollPeriodId: "period-1",
    branchId: "branch-1",
    staffId: "staff-1",
    fullName: "Alex Rivera",
    role: "mechanic",
    payBasis: "daily",
    baseRate: 650,
    overtimeRate: null,
    allowancePerPeriod: 0,
    dailyRateUsed: 650,
    hourlyRateUsed: 81.25,
    standardDailyHours: 8,
    holidayPremiumRate: 0.3,
    scheduledWorkdayCount: 22,
    holidayDayCount: 0,
    approvedLeaveDayCount: 0,
    expectedWorkdayCount: 22,
    missingAttendanceDayCount: 0,
    recordedDayCount: 20,
    presentCount: 18,
    lateCount: 2,
    absentCount: 1,
    halfDayCount: 0,
    missingTimeoutCount: 0,
    pendingApprovalCount: 0,
    workedMinutes: 9600,
    paidDayUnits: 20,
    holidayWorkedDayUnits: 0,
    lateDeductionMinutes: 0,
    overtimeMinutes: 0,
    basePay: 13000,
    lateDeductionAmount: 0,
    holidayPremiumPay: 0,
    overtimePay: 0,
    allowancePay: 0,
    computedPay: 13000,
    manualAdditionsTotal: 0,
    manualDeductionsTotal: 0,
    grossPay: 13000,
    netPay: 13000,
    readinessStatus: "ready",
    warningCodes: [],
    adjustments: [],
    ...overrides,
  };
}

describe("payroll validation", () => {
  it("detects blocking and warning payroll issues", () => {
    const items = [
      buildItem({
        id: "item-1",
        readinessStatus: "needs_dtr_completion",
        warningCodes: ["needs_dtr_completion"],
        missingTimeoutCount: 1,
      }),
      buildItem({
        id: "item-2",
        staffId: "staff-2",
        fullName: "Jamie Santos",
        payBasis: null,
        readinessStatus: "not_configured",
        warningCodes: ["not_configured"],
      }),
      buildItem({
        id: "item-3",
        staffId: "staff-3",
        fullName: "Chris Lee",
        warningCodes: ["custom_holiday_rule"],
        adjustments: [
          {
            id: "adj-1",
            payrollPeriodItemId: "item-3",
            adjustmentType: "addition",
            label: "Bonus",
            amount: 500,
            notes: null,
            source: "manual",
            systemKey: null,
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z",
          },
        ],
      }),
    ];

    const issues = computePayrollIssues(items);

    expect(issues.some((issue) => issue.type === "missing_dtr")).toBe(true);
    expect(issues.some((issue) => issue.type === "missing_employment_type")).toBe(true);
    expect(issues.some((issue) => issue.type === "manual_adjustments")).toBe(true);
    expect(issues.some((issue) => issue.type === "holiday_overrides")).toBe(true);
  });

  it("blocks payroll lock when blocking issues remain", () => {
    const items = [
      buildItem({
        readinessStatus: "needs_dtr_completion",
        warningCodes: ["needs_dtr_completion"],
        missingTimeoutCount: 1,
      }),
    ];
    const summary = summarizePayrollReviewItems(items);
    const validation = computePayrollLockValidation(items, summary);

    expect(validation.canLock).toBe(false);
    expect(validation.blockingIssueTypes).toBeGreaterThan(0);
  });

  it("resolves lifecycle and employee workflow statuses", () => {
    const summary = summarizePayrollReviewItems([buildItem()]);
    const lifecycle = resolvePayrollLifecycleStatus({
      period: {
        id: "period-1",
        branchId: "branch-1",
        label: "Payroll July 2026",
        periodStartDate: "2026-07-01",
        periodEndDate: "2026-07-31",
        payoutDate: "2026-07-31",
        status: "draft",
        notes: null,
        applyGovernmentDeductions: true,
        createdByStaffId: null,
        generatedByStaffId: null,
        generatedAt: "2026-07-31T00:00:00.000Z",
        finalizedByStaffId: null,
        finalizedAt: null,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
      summary,
      hasGeneratedCut: true,
      blockingIssueCount: 0,
    });

    expect(lifecycle).toBe("ready_to_lock");
    expect(resolvePayrollEmployeeWorkflowStatus(buildItem(), "draft")).toBe("ready");
    expect(resolvePayrollEmployeeWorkflowStatus(buildItem(), "processing")).toBe("locked");
    expect(itemHasPayrollIssue(buildItem({ netPay: -100 }), "negative_payroll")).toBe(true);
  });

  it("builds per-employee action items for the review workspace", () => {
    const items = [
      buildItem({
        readinessStatus: "needs_dtr_completion",
        warningCodes: ["needs_dtr_completion"],
      }),
      buildItem({
        id: "item-2",
        staffId: "staff-2",
        fullName: "TJ Coyoca",
        readinessStatus: "missing_compensation",
        warningCodes: ["missing_compensation"],
        payBasis: "daily",
        baseRate: 0,
        dailyRateUsed: 0,
      }),
    ];

    const actionItems = computePayrollEmployeeActionItems(items, "period-1");

    expect(actionItems.some((item) => item.employeeName === "Alex Rivera")).toBe(true);
    expect(actionItems.some((item) => item.employeeName === "TJ Coyoca")).toBe(true);
    expect(actionItems.some((item) => item.issueLabel === "Missing DTR")).toBe(true);
    expect(actionItems.some((item) => item.actionLabel === "Configure Salary")).toBe(true);
  });

  it("returns one primary issue per employee with blocking priority", () => {
    const charlie = buildItem({
      id: "item-charlie",
      staffId: "staff-charlie",
      fullName: "Charlie Mae Coyoca",
      readinessStatus: "needs_dtr_completion",
      warningCodes: ["needs_dtr_completion"],
      payBasis: null,
    });
    const tj = buildItem({
      id: "item-tj",
      staffId: "staff-tj",
      fullName: "TJ Coyoca",
      payBasis: null,
      readinessStatus: "not_configured",
      warningCodes: ["not_configured"],
    });
    const items = [charlie, tj];

    const primaryItems = computePrimaryEmployeeActionItems(items, "period-1");

    expect(primaryItems).toHaveLength(2);
    expect(resolvePrimaryEmployeeActionItem(charlie, "period-1")?.issueLabel).toBe("Missing DTR");
    expect(resolvePrimaryEmployeeActionItem(tj, "period-1")?.issueLabel).toBe(
      "Missing Employment Type",
    );
    expect(countEmployeesWithBlockingIssues(items, "period-1")).toBe(2);
    expect(computePayrollEmployeeActionItems(items, "period-1").length).toBeGreaterThan(2);
  });
});
