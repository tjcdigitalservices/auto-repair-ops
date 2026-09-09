import { DateTime } from "luxon";

import { countScheduledWorkdays } from "@/features/attendance/utils";
import type { StaffScheduleSummary } from "@/features/attendance/types";
import { formatMoneyInputValue } from "@/lib/currency";
import { formatDate, getBusinessNow } from "@/lib/dates";
import type {
  CompensationProfileFormValues,
  CompensationProfileSummary,
  PayBasis,
  PayrollAttendanceSourceRecord,
  PayrollPeriodItemBreakdownDay,
  PayrollPeriodItemDifferenceDetail,
  PayrollPeriodItemSummary,
  PayrollPeriodItemWarningDetail,
  PayrollFormActionState,
  PayrollPageFilters,
  PayrollPeriodFormValues,
  PayrollPeriodStaffSummary,
  PayrollPeriodStatus,
  PayrollReviewIssueFilter,
  PayrollReviewQuickFilter,
  PayrollReviewStatus,
  PayrollReviewStatusFilter,
  PayrollStaffReadinessStatus,
  PayrollStaffSetupFilter,
  PayrollWarningCode,
} from "@/features/payroll/types";
import { itemHasPayrollIssue } from "@/features/payroll/payroll-validation";

export const PAY_BASIS_OPTIONS: Array<{
  value: PayBasis;
  label: string;
}> = [
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
  { value: "hourly", label: "Hourly" },
];

export const PAYROLL_PERIOD_STATUS_OPTIONS: Array<{
  value: PayrollPeriodStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "processing", label: "Processing" },
  { value: "finalized", label: "Finalized" },
];

export const INITIAL_PAYROLL_FORM_ACTION_STATE: PayrollFormActionState = {
  status: "idle",
};

export const PAYROLL_STAFF_SETUP_FILTER_OPTIONS: Array<{
  value: Exclude<PayrollStaffSetupFilter, "">;
  label: string;
}> = [
  { value: "missing_compensation", label: "Missing compensation" },
  { value: "missing_schedule", label: "Missing schedule" },
  { value: "compensation_ready", label: "Compensation ready" },
  { value: "schedule_ready", label: "Schedules ready" },
];

export function isPayrollStaffSetupFilter(
  value: string | undefined,
): value is Exclude<PayrollStaffSetupFilter, ""> {
  return (
    value === "missing_compensation" ||
    value === "missing_schedule" ||
    value === "compensation_ready" ||
    value === "schedule_ready"
  );
}

export function resolvePayrollPageFilters(params: {
  periodSearch?: string;
  staffSearch?: string;
  staffFilter?: string;
  periodStatus?: string;
}): PayrollPageFilters {
  return {
    periodSearch: params.periodSearch?.trim() ?? "",
    staffSearch: params.staffSearch?.trim() ?? "",
    staffFilter: isPayrollStaffSetupFilter(params.staffFilter) ? params.staffFilter : "",
    periodStatus: isPayrollPeriodStatus(params.periodStatus) ? params.periodStatus : "",
  };
}

export function isCompensationSetupComplete(item: {
  schedule: StaffScheduleSummary | null;
  profile: CompensationProfileSummary | null;
}) {
  return Boolean(item.schedule && item.profile);
}

export function getCompensationSetupStatusLabel(item: {
  schedule: StaffScheduleSummary | null;
  profile: CompensationProfileSummary | null;
}) {
  return isCompensationSetupComplete(item) ? "Configured" : "Configuration Incomplete";
}

export function getCompensationSetupStatusTone(item: {
  schedule: StaffScheduleSummary | null;
  profile: CompensationProfileSummary | null;
}) {
  return isCompensationSetupComplete(item) ? "success" : "warning";
}

export function formatPayBasisLabel(payBasis: PayBasis) {
  switch (payBasis) {
    case "monthly":
      return "Monthly";
    case "daily":
      return "Daily";
    case "hourly":
      return "Hourly";
  }
}

export function formatPayrollPeriodStatusLabel(status: PayrollPeriodStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "processing":
      return "Processing";
    case "finalized":
      return "Finalized";
  }
}

export function getPayrollPeriodStatusTone(status: PayrollPeriodStatus) {
  switch (status) {
    case "draft":
      return "neutral";
    case "processing":
      return "warning";
    case "finalized":
      return "success";
  }
}

export function formatPayrollCoverage(periodStartDate: string, periodEndDate: string) {
  return `${formatDate(periodStartDate)} to ${formatDate(periodEndDate)}`;
}

export function formatWorkedDuration(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0h";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatPayrollDayUnits(dayUnits: number) {
  const normalized = Number(dayUnits.toFixed(2));

  if (Number.isInteger(normalized)) {
    return String(normalized);
  }

  return normalized.toString();
}

export function getPayrollAttendedDayCount(params: {
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
}) {
  return params.presentCount + params.lateCount + params.halfDayCount;
}

export function formatPayrollReadinessLabel(status: PayrollStaffReadinessStatus) {
  switch (status) {
    case "ready":
      return "Ready";
    case "missing_schedule":
      return "Missing schedule";
    case "missing_compensation":
      return "Missing compensation";
    case "missing_attendance":
      return "Missing attendance";
    case "needs_dtr_completion":
      return "Needs DTR completion";
    case "configured_no_activity":
      return "Configured";
    case "not_configured":
      return "Not configured";
  }
}

export function getPayrollReadinessTone(status: PayrollStaffReadinessStatus) {
  switch (status) {
    case "ready":
      return "success";
    case "configured_no_activity":
      return "info";
    case "missing_schedule":
    case "missing_compensation":
    case "missing_attendance":
    case "needs_dtr_completion":
      return "warning";
    case "not_configured":
      return "neutral";
  }
}

export function formatPayrollWarningLabel(code: PayrollWarningCode) {
  switch (code) {
    case "missing_schedule":
      return "Missing schedule";
    case "missing_compensation":
      return "Salary Rate Required";
    case "missing_attendance":
      return "Missing attendance";
    case "needs_dtr_completion":
      return "Missing Time Out";
    case "not_configured":
      return "Not configured";
    case "pending_approval":
      return "Pending approval";
    case "custom_holiday_rule":
      return "Custom holiday rule";
    case "worked_during_approved_leave":
      return "Worked during approved leave";
  }
}

export function buildPayrollDifferenceDetails(
  days: PayrollPeriodItemBreakdownDay[],
): PayrollPeriodItemDifferenceDetail[] {
  return days.flatMap((day) => {
    const shouldExplainRecordedDifference = day.hasAttendanceRecord && day.paidDayUnits !== 1;
    const shouldExplainAutoPaidDay = !day.hasAttendanceRecord && day.paidDayUnits > 0;
    const shouldExplainScheduledUnpaidDay =
      !day.hasAttendanceRecord &&
      day.paidDayUnits === 0 &&
      (day.warningCodes.includes("missing_attendance") ||
        day.warningCodes.includes("custom_holiday_rule") ||
        day.holidayKind !== null ||
        day.isLeaveCovered);
    const shouldExplainWorkedDuringApprovedLeave = day.warningCodes.includes(
      "worked_during_approved_leave",
    );

    if (
      !shouldExplainRecordedDifference &&
      !shouldExplainAutoPaidDay &&
      !shouldExplainScheduledUnpaidDay &&
      !shouldExplainWorkedDuringApprovedLeave
    ) {
      return [];
    }

    return [
      {
        date: day.date,
        statusLabel: day.statusLabel,
        reason: day.payReason,
        paidDayUnits: day.paidDayUnits,
      },
    ];
  });
}

export function buildPayrollRecordedVsPaidExplanation(params: {
  item: Pick<PayrollPeriodItemSummary, "fullName" | "recordedDayCount" | "paidDayUnits">;
  days: PayrollPeriodItemBreakdownDay[];
}) {
  const paidLabel = formatPayrollDayUnits(params.item.paidDayUnits);
  const workedDuringLeaveDays = params.days.filter(
    (day) => day.isWorkedDuringApprovedLeave,
  ).length;
  const workedDuringLeaveNote =
    workedDuringLeaveDays > 0
      ? ` ${workedDuringLeaveDays} date${
          workedDuringLeaveDays === 1 ? " was" : "s were"
        } worked during approved leave, so the company leave premium was added on top of the normal worked-day pay.`
      : "";
  const fullyPaidRecordedDays = params.days.filter(
    (day) => day.hasAttendanceRecord && day.paidDayUnits === 1,
  ).length;
  const partiallyPaidRecordedDays = params.days.filter(
    (day) => day.hasAttendanceRecord && day.paidDayUnits > 0 && day.paidDayUnits < 1,
  ).length;
  const unpaidRecordedDays = params.days.filter(
    (day) => day.hasAttendanceRecord && day.paidDayUnits === 0,
  ).length;
  const autoPaidLeaveDays = params.days.filter(
    (day) => !day.hasAttendanceRecord && day.isApprovedLeavePaidDay,
  ).length;
  const autoPaidHolidayOrClosureDays = params.days.filter(
    (day) =>
      !day.hasAttendanceRecord && day.paidDayUnits > 0 && !day.isApprovedLeavePaidDay,
  ).length;

  if (params.item.recordedDayCount === params.item.paidDayUnits) {
    return `${params.item.fullName} has ${paidLabel} paid day${
      params.item.paidDayUnits === 1 ? "" : "s"
    } in this payroll period. This payroll uses paid attendance days, overtime, and manual adjustments for the selected coverage window.${workedDuringLeaveNote}`;
  }

  if (params.item.recordedDayCount > params.item.paidDayUnits) {
    if (unpaidRecordedDays > 0 && partiallyPaidRecordedDays > 0) {
      return `${params.item.fullName} has ${paidLabel} paid day${
        params.item.paidDayUnits === 1 ? "" : "s"
      } in this payroll period. Some dates were not fully paid: ${unpaidRecordedDays} date${
        unpaidRecordedDays === 1 ? " was" : "s were"
      } not paid, and ${partiallyPaidRecordedDays} date${
        partiallyPaidRecordedDays === 1 ? " was" : "s were"
      } only partially paid.${workedDuringLeaveNote}`;
    }

    if (unpaidRecordedDays > 0) {
      return `${params.item.fullName} has ${paidLabel} paid day${
        params.item.paidDayUnits === 1 ? "" : "s"
      } in this payroll period. Some dates were not paid because they were absent, missing required attendance, unpaid closure days, or otherwise not payable.${workedDuringLeaveNote}`;
    }

    if (partiallyPaidRecordedDays > 0) {
      return `${params.item.fullName} has ${paidLabel} paid day${
        params.item.paidDayUnits === 1 ? "" : "s"
      } in this payroll period. Some dates were only partially paid, such as half days or days with reduced payable time.${workedDuringLeaveNote}`;
    }
  }

  if (autoPaidLeaveDays > 0) {
    return `${params.item.fullName} has ${paidLabel} paid day${
      params.item.paidDayUnits === 1 ? "" : "s"
    } in this payroll period. ${autoPaidLeaveDays} approved leave date${
      autoPaidLeaveDays === 1 ? " was" : "s were"
    } paid as scheduled working day${autoPaidLeaveDays === 1 ? "" : "s"} without attendance logs.${workedDuringLeaveNote}`;
  }

  if (autoPaidHolidayOrClosureDays > 0) {
    return `${params.item.fullName} has ${paidLabel} paid day${
      params.item.paidDayUnits === 1 ? "" : "s"
    } in this payroll period. ${autoPaidHolidayOrClosureDays} date${
      autoPaidHolidayOrClosureDays === 1 ? " was" : "s were"
    } counted as paid without a punch record because of the configured holiday or closure treatment.${workedDuringLeaveNote}`;
  }

  return `${params.item.fullName} has ${paidLabel} paid day${
    params.item.paidDayUnits === 1 ? "" : "s"
  } in this payroll period. Use the daily breakdown and warnings below to review unpaid, partial, or exception dates.${workedDuringLeaveNote}`;
}

export function buildPayrollWarningDetails(params: {
  item: Pick<PayrollPeriodItemSummary, "warningCodes">;
  days: PayrollPeriodItemBreakdownDay[];
}): PayrollPeriodItemWarningDetail[] {
  const details = new Map<string, PayrollPeriodItemWarningDetail>();

  for (const day of params.days) {
    for (const warningCode of day.warningCodes) {
      const key = `${day.date}:${warningCode}`;
      details.set(key, {
        date: day.date,
        label: formatPayrollWarningLabel(warningCode),
        reason: resolvePayrollWarningReason(warningCode, day),
      });
    }
  }

  for (const warningCode of params.item.warningCodes) {
    const hasSpecificDay = params.days.some((day) => day.warningCodes.includes(warningCode));

    if (hasSpecificDay) {
      continue;
    }

    details.set(`general:${warningCode}`, {
      date: null,
      label: formatPayrollWarningLabel(warningCode),
      reason: resolvePayrollWarningReason(warningCode),
    });
  }

  return Array.from(details.values()).sort((left, right) => {
    if (left.date === right.date) {
      return left.label.localeCompare(right.label);
    }

    if (!left.date) {
      return 1;
    }

    if (!right.date) {
      return -1;
    }

    return left.date.localeCompare(right.date);
  });
}

export function buildCompensationProfileFormValues(
  staffId: string,
  profile: CompensationProfileSummary | null,
): CompensationProfileFormValues {
  return {
    staffId,
    payBasis: profile?.payBasis ?? "daily",
    baseRate: profile ? formatMoneyInputValue(profile.baseRate) : "",
    overtimeRate: profile?.overtimeRate ? formatMoneyInputValue(profile.overtimeRate) : "",
    allowancePerPeriod: profile ? formatMoneyInputValue(profile.allowancePerPeriod) : formatMoneyInputValue(0),
    effectiveStartDate: profile?.effectiveStartDate ?? getBusinessNow().toFormat("yyyy-LL-dd"),
    exemptFromAttendance: profile?.exemptFromAttendance ?? false,
    useShopDefaultContributions: profile?.useShopDefaultContributions ?? true,
    sssAmount: profile?.sssAmount != null ? formatMoneyInputValue(profile.sssAmount) : "",
    philhealthAmount:
      profile?.philhealthAmount != null ? formatMoneyInputValue(profile.philhealthAmount) : "",
    pagibigAmount: profile?.pagibigAmount != null ? formatMoneyInputValue(profile.pagibigAmount) : "",
    notes: profile?.notes ?? "",
  };
}

export function buildDefaultPayrollPeriodFormValues(): PayrollPeriodFormValues {
  const now = getBusinessNow();
  const startOfMonth = now.startOf("month").toFormat("yyyy-LL-dd");
  const endOfMonth = now.endOf("month").toFormat("yyyy-LL-dd");
  const monthLabel = now.toFormat("LLLL yyyy");

  return {
    label: `Payroll ${monthLabel}`,
    periodStartDate: startOfMonth,
    periodEndDate: endOfMonth,
    payoutDate: endOfMonth,
    notes: "",
    applyGovernmentDeductions: true,
  };
}

export function summarizePayrollAttendance(
  records: PayrollAttendanceSourceRecord[],
  options: {
    ignoredMissingTimeoutDates?: Set<string>;
  } = {},
) {
  return records.reduce(
    (summary, record) => {
      summary.recordedDays += 1;

      summary.approvedCount += 1;

      if (record.status === "present") {
        summary.presentCount += 1;
      }

      if (record.status === "late") {
        summary.lateCount += 1;
      }

      if (record.status === "half_day") {
        summary.halfDayCount += 1;
      }

      if (record.status === "absent") {
        summary.absentCount += 1;
      }

      if (
        record.timeIn &&
        !record.timeOut &&
        !options.ignoredMissingTimeoutDates?.has(record.attendanceDate)
      ) {
        summary.missingTimeoutCount += 1;
      }

      if (record.timeIn && record.timeOut) {
        const timeIn = DateTime.fromISO(record.timeIn, { zone: "utc" });
        const timeOut = DateTime.fromISO(record.timeOut, { zone: "utc" });

        if (timeIn.isValid && timeOut.isValid && timeOut > timeIn) {
          summary.workedMinutes += Math.round(timeOut.diff(timeIn, "minutes").minutes);
        }
      }

      return summary;
    },
    {
      recordedDays: 0,
      presentCount: 0,
      lateCount: 0,
      halfDayCount: 0,
      absentCount: 0,
      missingTimeoutCount: 0,
      approvedCount: 0,
      pendingApprovalCount: 0,
      workedMinutes: 0,
    },
  );
}

export function resolvePayrollReadinessStatus({
  hasCompensationProfile,
  hasSchedule,
  expectedWorkdayCount,
  hadAttendanceActivity,
  missingAttendanceDayCount,
  missingTimeoutCount,
  exemptFromAttendance = false,
}: {
  hasCompensationProfile: boolean;
  hasSchedule: boolean;
  expectedWorkdayCount: number;
  hadAttendanceActivity: boolean;
  missingAttendanceDayCount: number;
  missingTimeoutCount: number;
  exemptFromAttendance?: boolean;
}): PayrollStaffReadinessStatus {
  if (!exemptFromAttendance && missingTimeoutCount > 0) {
    return "needs_dtr_completion";
  }

  if (hadAttendanceActivity && !hasCompensationProfile) {
    return "missing_compensation";
  }

  if (hasCompensationProfile && !hasSchedule) {
    return "missing_schedule";
  }

  if (!exemptFromAttendance && missingAttendanceDayCount > 0) {
    return "missing_attendance";
  }

  if (!hasCompensationProfile) {
    return "not_configured";
  }

  if (expectedWorkdayCount === 0 && !hadAttendanceActivity && !exemptFromAttendance) {
    return "configured_no_activity";
  }

  return "ready";
}

export function isBlockedPayrollStaffSummary(summary: Pick<
  PayrollPeriodStaffSummary,
  "readinessStatus"
>) {
  return (
    summary.readinessStatus === "missing_compensation" ||
    summary.readinessStatus === "missing_schedule" ||
    summary.readinessStatus === "missing_attendance" ||
    summary.readinessStatus === "needs_dtr_completion"
  );
}

const MANUAL_REVIEW_WARNING_CODES = new Set<PayrollWarningCode>([
  "custom_holiday_rule",
  "worked_during_approved_leave",
]);

export function resolvePayrollReviewStatus(
  item: Pick<PayrollPeriodItemSummary, "readinessStatus" | "warningCodes">,
): PayrollReviewStatus {
  if (item.readinessStatus === "needs_dtr_completion") {
    return "missing_dtr";
  }

  if (
    item.readinessStatus === "missing_compensation" ||
    item.readinessStatus === "not_configured"
  ) {
    return "missing_salary_rate";
  }

  if (item.readinessStatus === "missing_attendance") {
    return "missing_attendance";
  }

  if (item.readinessStatus === "missing_schedule") {
    return "missing_schedule";
  }

  if (
    item.warningCodes.some((code) => MANUAL_REVIEW_WARNING_CODES.has(code)) ||
    (item.readinessStatus !== "ready" && item.warningCodes.length > 0)
  ) {
    return "manual_review";
  }

  if (isBlockedPayrollStaffSummary(item)) {
    return "payroll_blocked";
  }

  return "ready";
}

export function isPayrollReviewReady(
  item: Pick<PayrollPeriodItemSummary, "readinessStatus" | "warningCodes">,
) {
  return resolvePayrollReviewStatus(item) === "ready";
}

export function itemNeedsPayrollReview(
  item: Pick<PayrollPeriodItemSummary, "readinessStatus" | "warningCodes">,
) {
  return !isPayrollReviewReady(item);
}

export function formatPayrollReviewStatusLabel(status: PayrollReviewStatus) {
  switch (status) {
    case "ready":
      return "Ready";
    case "missing_dtr":
      return "Missing DTR";
    case "missing_salary_rate":
      return "Missing Salary Rate";
    case "missing_attendance":
      return "Missing Attendance";
    case "missing_schedule":
      return "Missing Schedule";
    case "manual_review":
      return "Manual Review";
    case "payroll_blocked":
      return "Payroll Blocked";
  }
}

export function getPayrollReviewStatusTone(status: PayrollReviewStatus) {
  switch (status) {
    case "ready":
      return "success";
    case "manual_review":
      return "warning";
    case "missing_dtr":
    case "missing_salary_rate":
    case "missing_attendance":
    case "missing_schedule":
    case "payroll_blocked":
      return "destructive";
  }
}

export function formatPayrollWorkedHoursSummary(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0 hrs";
  }

  const hours = Math.round(totalMinutes / 60);
  return `${hours} hrs`;
}

export function formatPayrollPayoutDate(value: string) {
  const parsed = DateTime.fromISO(value);

  if (!parsed.isValid) {
    return formatDate(value);
  }

  return parsed.toFormat("LLL d");
}

export function formatPayrollRoleLabel(role: string) {
  return role.replaceAll("_", " ");
}

export function isPayrollReviewQuickFilter(
  value: string | null | undefined,
): value is Exclude<PayrollReviewQuickFilter, ""> {
  return (
    value === "ready" ||
    value === "needs_review" ||
    value === "blocking_issues" ||
    value === "warnings" ||
    value === "missing_dtr" ||
    value === "missing_salary_rate" ||
    value === "manual_adjustments" ||
    value === "holiday_pay" ||
    value === "overtime"
  );
}

export function isPayrollReviewIssueFilter(
  value: string | null | undefined,
): value is PayrollReviewIssueFilter {
  return (
    value === "blocking_issues" ||
    value === "warnings" ||
    value === "missing_dtr" ||
    value === "missing_salary_rate" ||
    value === "manual_adjustments" ||
    value === "holiday_pay" ||
    value === "overtime"
  );
}

export function isPayrollReviewStatusFilter(
  value: string | null | undefined,
): value is Exclude<PayrollReviewStatusFilter, ""> {
  return value === "ready" || value === "needs_review";
}

export function filterPayrollReviewItems(
  items: PayrollPeriodItemSummary[],
  params: {
    search: string;
    status: PayrollReviewStatusFilter;
    issue: PayrollReviewIssueFilter | "";
    role: string;
  },
) {
  const search = params.search.trim().toLowerCase();

  return items.filter((item) => {
    if (search && !item.fullName.toLowerCase().includes(search)) {
      return false;
    }

    if (params.role && item.role !== params.role) {
      return false;
    }

    const reviewStatus = resolvePayrollReviewStatus(item);

    if (params.status === "ready" && reviewStatus !== "ready") {
      return false;
    }

    if (params.status === "needs_review" && !itemNeedsPayrollReview(item)) {
      return false;
    }

    if (!params.issue) {
      return true;
    }

    switch (params.issue) {
      case "blocking_issues":
        return (
          isBlockedPayrollStaffSummary(item) ||
          item.netPay < 0 ||
          reviewStatus === "missing_dtr" ||
          reviewStatus === "missing_salary_rate" ||
          reviewStatus === "missing_attendance" ||
          reviewStatus === "missing_schedule" ||
          reviewStatus === "payroll_blocked"
        );
      case "missing_dtr":
        return reviewStatus === "missing_dtr" || itemHasPayrollIssue(item, "missing_dtr");
      case "missing_salary_rate":
        return (
          reviewStatus === "missing_salary_rate" ||
          itemHasPayrollIssue(item, "missing_salary_rate") ||
          itemHasPayrollIssue(item, "missing_employment_type")
        );
      case "manual_adjustments":
        return itemHasPayrollIssue(item, "manual_adjustments");
      case "holiday_pay":
        return itemHasPayrollIssue(item, "holiday_overrides");
      case "overtime":
        return itemHasPayrollIssue(item, "excessive_overtime");
      case "warnings":
        return (
          item.warningCodes.length > 0 ||
          itemHasPayrollIssue(item, "manual_adjustments") ||
          itemHasPayrollIssue(item, "excessive_overtime") ||
          itemHasPayrollIssue(item, "holiday_overrides") ||
          itemHasPayrollIssue(item, "missing_leave_configuration")
        );
      default:
        return true;
    }
  });
}

export function summarizePayrollReviewItems(items: PayrollPeriodItemSummary[]) {
  return items.reduce(
    (summary, item) => {
      summary.totalStaffCount += 1;
      summary.totalWorkedMinutes += item.workedMinutes;
      summary.totalBasePay += item.basePay;
      summary.totalLateDeductions += item.lateDeductionAmount;
      summary.totalHolidayPremiumPay += item.holidayPremiumPay;
      summary.totalOvertimePay += item.overtimePay;
      summary.totalAllowancePay += item.allowancePay;
      summary.totalManualAdditions += item.manualAdditionsTotal;
      summary.totalManualDeductions += item.manualDeductionsTotal;
      summary.totalGrossPay += item.grossPay;
      summary.totalNetPay += item.netPay;

      const reviewStatus = resolvePayrollReviewStatus(item);

      if (reviewStatus === "ready") {
        summary.readyStaffCount += 1;
      }

      if (itemNeedsPayrollReview(item)) {
        summary.needsReviewCount += 1;
      }

      if (reviewStatus === "missing_dtr") {
        summary.missingDtrCount += 1;
      }

      if (reviewStatus === "missing_salary_rate") {
        summary.missingSalaryRateCount += 1;
      }

      if (reviewStatus === "manual_review") {
        summary.manualReviewCount += 1;
      }

      if (isBlockedPayrollStaffSummary(item)) {
        summary.blockedStaffCount += 1;
      }

      if (item.warningCodes.length > 0) {
        summary.warningStaffCount += 1;
      }

      if (item.warningCodes.includes("missing_schedule")) {
        summary.missingScheduleCount += 1;
      }

      if (
        item.warningCodes.includes("missing_compensation") ||
        item.warningCodes.includes("not_configured")
      ) {
        summary.missingCompensationCount += 1;
      }

      if (item.warningCodes.includes("missing_attendance")) {
        summary.missingAttendanceCount += 1;
      }

      if (item.missingTimeoutCount > 0) {
        summary.openShiftCount += 1;
      }

      return summary;
    },
    {
      totalStaffCount: 0,
      readyStaffCount: 0,
      needsReviewCount: 0,
      missingDtrCount: 0,
      missingSalaryRateCount: 0,
      manualReviewCount: 0,
      blockedStaffCount: 0,
      warningStaffCount: 0,
      missingScheduleCount: 0,
      missingCompensationCount: 0,
      missingAttendanceCount: 0,
      openShiftCount: 0,
      pendingApprovalCount: 0,
      totalWorkedMinutes: 0,
      totalBasePay: 0,
      totalLateDeductions: 0,
      totalHolidayPremiumPay: 0,
      totalOvertimePay: 0,
      totalAllowancePay: 0,
      totalManualAdditions: 0,
      totalManualDeductions: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
    },
  );
}

export function computeScheduledWorkdayCountForPeriod(
  schedule: StaffScheduleSummary | null,
  periodStartDate: string,
  periodEndDate: string,
) {
  return countScheduledWorkdays(schedule, periodStartDate, periodEndDate);
}

function isPayrollPeriodStatus(value: string | undefined): value is PayrollPeriodStatus {
  return PAYROLL_PERIOD_STATUS_OPTIONS.some((option) => option.value === value);
}

function resolvePayrollWarningReason(
  code: PayrollWarningCode,
  day?: PayrollPeriodItemBreakdownDay,
) {
  switch (code) {
    case "missing_schedule":
      return "No work schedule is configured for this staff member.";
    case "missing_compensation":
      return "No compensation profile is configured for this staff member.";
    case "missing_attendance":
      return day?.holidayKind
        ? `${day.statusLabel} is not counted as paid and has no attendance record.`
        : "Scheduled workday has no attendance record.";
    case "needs_dtr_completion":
      return "Time out is missing for this attendance date.";
    case "not_configured":
      return "Payroll setup is incomplete for this staff member.";
    case "pending_approval":
      return "Attendance is still pending approval.";
    case "custom_holiday_rule":
      return day?.holidayLabel
        ? `${day.holidayLabel} uses a custom pay treatment and should be reviewed manually.`
        : "Holiday pay treatment is custom and should be reviewed manually.";
    case "worked_during_approved_leave":
      return "Approved leave exists on this date, but the staff member also worked so the leave premium was applied.";
  }
}
