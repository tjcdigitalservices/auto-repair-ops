import type { StaffRole } from "@/lib/auth/permissions";
import type { PrintDocumentBusinessProfile } from "@/components/reports/print-document-page";
import type {
  BranchHolidayKind,
  BranchHolidayPayTreatment,
  StaffLeaveType,
  StaffScheduleSummary,
} from "@/features/attendance/types";
import type { Database } from "@/types/database";

export type PayBasis = Database["public"]["Enums"]["pay_basis"];
export type PayrollPeriodStatus = Database["public"]["Enums"]["payroll_period_status"];

export type PayrollStaffSetupFilter =
  | ""
  | "missing_compensation"
  | "missing_schedule"
  | "compensation_ready"
  | "schedule_ready";

export type PayrollPageFilters = {
  periodSearch: string;
  staffSearch: string;
  staffFilter: PayrollStaffSetupFilter;
  periodStatus: PayrollPeriodStatus | "";
};

export type CompensationProfileSummary = {
  id: string;
  staffId: string;
  payBasis: PayBasis;
  baseRate: number;
  overtimeRate: number | null;
  allowancePerPeriod: number;
  effectiveStartDate: string;
  exemptFromAttendance: boolean;
  notes: string | null;
};

export type PayrollCompensationRosterItem = {
  staffId: string;
  fullName: string;
  role: StaffRole;
  contactNumber: string | null;
  isPayrollEligible: boolean;
  schedule: StaffScheduleSummary | null;
  profile: CompensationProfileSummary | null;
};

export type PayrollExcludedStaffItem = {
  staffId: string;
  fullName: string;
  role: StaffRole;
};

export type PayrollDashboardSummary = {
  eligibleStaffCount: number;
  compensatedStaffCount: number;
  missingCompensationCount: number;
  scheduledStaffCount: number;
  missingScheduleCount: number;
  configuredStaffCount: number;
  incompleteSetupCount: number;
  payrollPeriodCount: number;
  draftPeriodCount: number;
  processingPeriodCount: number;
  finalizedPeriodCount: number;
};

export type PayrollPeriodSummary = {
  id: string;
  branchId: string;
  label: string;
  periodStartDate: string;
  periodEndDate: string;
  payoutDate: string;
  status: PayrollPeriodStatus;
  notes: string | null;
  createdByStaffId: string | null;
  generatedByStaffId: string | null;
  generatedAt: string | null;
  finalizedByStaffId: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayrollPageData = {
  filters: PayrollPageFilters;
  summary: PayrollDashboardSummary;
  payrollPeriods: PayrollPeriodSummary[];
  compensationRoster: PayrollCompensationRosterItem[];
  excludedPayrollStaff: PayrollExcludedStaffItem[];
  totalCompensationRosterCount: number;
  visibleCompensationRosterCount: number;
};

export type CompensationProfileFormValues = {
  staffId: string;
  payBasis: PayBasis;
  baseRate: string;
  overtimeRate: string;
  allowancePerPeriod: string;
  effectiveStartDate: string;
  exemptFromAttendance: boolean;
  notes: string;
};

export type PayrollPeriodFormValues = {
  label: string;
  periodStartDate: string;
  periodEndDate: string;
  payoutDate: string;
  notes: string;
};

export type PayrollPeriodStatusFormValues = {
  periodId: string;
  status: PayrollPeriodStatus;
};

export type PayrollFormActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type PayrollStaffReadinessStatus =
  | "ready"
  | "missing_schedule"
  | "missing_compensation"
  | "missing_attendance"
  | "needs_dtr_completion"
  | "configured_no_activity"
  | "not_configured";

export type PayrollPeriodStaffSummary = {
  staffId: string;
  fullName: string;
  role: StaffRole;
  contactNumber: string | null;
  schedule: StaffScheduleSummary | null;
  compensationProfile: CompensationProfileSummary | null;
  hadAttendanceActivity: boolean;
  isBlocked: boolean;
  readinessStatus: PayrollStaffReadinessStatus;
  scheduledWorkdayCount: number;
  holidayDayCount: number;
  approvedLeaveDayCount: number;
  expectedWorkdayCount: number;
  missingAttendanceDayCount: number;
  recordedDays: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  missingTimeoutCount: number;
  approvedCount: number;
  pendingApprovalCount: number;
  workedMinutes: number;
};

export type PayrollPeriodDetailSummary = {
  totalStaffCount: number;
  readyStaffCount: number;
  needsReviewCount: number;
  missingDtrCount: number;
  missingSalaryRateCount: number;
  manualReviewCount: number;
  blockedStaffCount: number;
  warningStaffCount: number;
  missingScheduleCount: number;
  missingCompensationCount: number;
  missingAttendanceCount: number;
  openShiftCount: number;
  pendingApprovalCount: number;
  totalWorkedMinutes: number;
  totalBasePay: number;
  totalLateDeductions: number;
  totalHolidayPremiumPay: number;
  totalOvertimePay: number;
  totalAllowancePay: number;
  totalManualAdditions: number;
  totalManualDeductions: number;
  totalGrossPay: number;
  totalNetPay: number;
};

export type PayrollReviewStatus =
  | "ready"
  | "missing_dtr"
  | "missing_salary_rate"
  | "missing_attendance"
  | "missing_schedule"
  | "manual_review"
  | "payroll_blocked";

export type PayrollReviewQuickFilter =
  | ""
  | "ready"
  | "needs_review"
  | "blocking_issues"
  | "warnings"
  | "missing_dtr"
  | "missing_salary_rate"
  | "manual_adjustments"
  | "holiday_pay"
  | "overtime";

export type PayrollIssueSeverity = "blocking" | "warning";

export type PayrollIssueType =
  | "missing_dtr"
  | "missing_salary_rate"
  | "missing_employment_type"
  | "negative_payroll"
  | "invalid_attendance"
  | "manual_adjustments"
  | "excessive_overtime"
  | "holiday_overrides"
  | "missing_leave_configuration";

export type PayrollReviewStatusFilter = "" | "ready" | "needs_review";

export type PayrollReviewIssueFilter = Exclude<
  PayrollReviewQuickFilter,
  "" | "ready" | "needs_review"
>;

export type PayrollEmployeeActionItem = {
  id: string;
  itemId: string;
  staffId: string;
  employeeName: string;
  issueType: PayrollIssueType;
  issueLabel: string;
  explanation: string;
  severity: PayrollIssueSeverity;
  actionLabel: string;
  actionHref: string;
};

export type PayrollIssueSummary = {
  type: PayrollIssueType;
  label: string;
  severity: PayrollIssueSeverity;
  affectedCount: number;
  affectedStaffIds: string[];
  actionLabel: string;
  filter: PayrollReviewQuickFilter;
};

export type PayrollLifecycleStatus =
  | "draft"
  | "reviewing"
  | "ready_to_lock"
  | "locked"
  | "payslips_generated"
  | "paid";

export type PayrollWorkflowStep =
  | "generate"
  | "review"
  | "resolve_issues"
  | "lock_payroll"
  | "generate_payslips"
  | "mark_paid";

export type PayrollLockValidationCheck = {
  id: string;
  label: string;
  passed: boolean;
  severity: PayrollIssueSeverity;
};

export type PayrollLockValidationResult = {
  canLock: boolean;
  blockingIssueCount: number;
  blockingIssueTypes: number;
  warningIssueTypes: number;
  checks: PayrollLockValidationCheck[];
  issues: PayrollIssueSummary[];
};

export type PayrollEmployeeReviewTab =
  | "overview"
  | "attendance"
  | "payroll"
  | "adjustments"
  | "warnings"
  | "history";

export type PayrollPeriodAdjustmentType = "addition" | "deduction";

export type PayrollWarningCode =
  | "missing_schedule"
  | "missing_compensation"
  | "missing_attendance"
  | "needs_dtr_completion"
  | "not_configured"
  | "pending_approval"
  | "custom_holiday_rule"
  | "worked_during_approved_leave";

export type PayrollPeriodItemAdjustmentSummary = {
  id: string;
  payrollPeriodItemId: string;
  adjustmentType: PayrollPeriodAdjustmentType;
  label: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayrollPeriodItemSummary = {
  id: string;
  payrollPeriodId: string;
  branchId: string;
  staffId: string;
  fullName: string;
  role: StaffRole;
  payBasis: PayBasis | null;
  baseRate: number | null;
  overtimeRate: number | null;
  allowancePerPeriod: number;
  dailyRateUsed: number;
  hourlyRateUsed: number;
  standardDailyHours: number;
  holidayPremiumRate: number;
  scheduledWorkdayCount: number;
  holidayDayCount: number;
  approvedLeaveDayCount: number;
  expectedWorkdayCount: number;
  missingAttendanceDayCount: number;
  recordedDayCount: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  missingTimeoutCount: number;
  pendingApprovalCount: number;
  workedMinutes: number;
  paidDayUnits: number;
  holidayWorkedDayUnits: number;
  lateDeductionMinutes: number;
  overtimeMinutes: number;
  basePay: number;
  lateDeductionAmount: number;
  holidayPremiumPay: number;
  overtimePay: number;
  allowancePay: number;
  computedPay: number;
  manualAdditionsTotal: number;
  manualDeductionsTotal: number;
  grossPay: number;
  netPay: number;
  readinessStatus: PayrollStaffReadinessStatus;
  warningCodes: PayrollWarningCode[];
  adjustments: PayrollPeriodItemAdjustmentSummary[];
};

export type PayrollPeriodItemBreakdownDay = {
  date: string;
  weekdayLabel: string;
  attendanceStatus: Database["public"]["Enums"]["attendance_status"] | null;
  statusLabel: string;
  timeIn: string | null;
  timeOut: string | null;
  workedMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  lateDeductionMinutes: number;
  paidDayUnits: number;
  isPaid: boolean;
  payReason: string;
  warningCodes: PayrollWarningCode[];
  holidayLabel: string | null;
  holidayKind: BranchHolidayKind | null;
  holidayPayTreatment: BranchHolidayPayTreatment | null;
  hasAttendanceRecord: boolean;
  hasPendingApproval: boolean;
  isScheduledWorkday: boolean;
  isLeaveCovered: boolean;
  leaveType: StaffLeaveType | null;
  isApprovedLeavePaidDay: boolean;
  approvedLeavePay: number;
  isWorkedDuringApprovedLeave: boolean;
  workedDuringApprovedLeavePremiumPay: number;
  isRestDay: boolean;
};

export type PayrollPeriodItemDifferenceDetail = {
  date: string;
  statusLabel: string;
  reason: string;
  paidDayUnits: number;
};

export type PayrollPeriodItemWarningDetail = {
  date: string | null;
  label: string;
  reason: string;
};

export type PayrollSettingsSummary = {
  standardDailyHours: number;
  holidayPremiumRate: number;
};

export type PayrollPeriodDetailData = {
  period: PayrollPeriodSummary;
  settings: PayrollSettingsSummary;
  summary: PayrollPeriodDetailSummary;
  items: PayrollPeriodItemSummary[];
};

export type PayrollPeriodItemBreakdownData = {
  period: PayrollPeriodSummary;
  settings: PayrollSettingsSummary;
  item: PayrollPeriodItemSummary;
  days: PayrollPeriodItemBreakdownDay[];
  recordedVsPaidExplanation: string;
  differenceDetails: PayrollPeriodItemDifferenceDetail[];
  warningDetails: PayrollPeriodItemWarningDetail[];
};

export type PayrollPrintDocument = PayrollPeriodDetailData & {
  businessProfile: PrintDocumentBusinessProfile;
  generatedAt: string;
};

export type PayslipPrintDocument = {
  period: PayrollPeriodSummary;
  settings: PayrollSettingsSummary;
  item: PayrollPeriodItemSummary;
  businessProfile: PrintDocumentBusinessProfile;
  generatedAt: string;
};

export type PayrollAttendanceSourceRecord = {
  attendanceDate: string;
  status: Database["public"]["Enums"]["attendance_status"];
  timeIn: string | null;
  timeOut: string | null;
  approvedAt: string | null;
};

export type PayrollAdjustmentFormValues = {
  payrollPeriodId: string;
  payrollPeriodItemId: string;
  adjustmentType: PayrollPeriodAdjustmentType;
  label: string;
  amount: string;
  notes: string;
};
