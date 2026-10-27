import {
  computePayrollItemBreakdown,
  type PayrollHolidayRule,
} from "@/features/payroll/calculations";
import {
  governmentContributionEntries,
  isReservedGovernmentAdjustmentLabel,
  resolveGovernmentContributions,
} from "@/features/payroll/government-contributions";
import {
  buildRemittanceEmployeeRows,
  periodOverlapsRemittanceMonth,
  resolveRemittanceMonth,
  summarizeRemittanceRows,
} from "@/features/payroll/remittance-summary";
import type {
  CompensationProfileSummary,
  PayrollPeriodDetailData,
  PayrollPeriodItemAdjustmentSummary,
  PayrollPeriodItemBreakdownData,
  PayrollPeriodItemSummary,
  PayrollPeriodSummary,
  PayrollPrintDocument,
  PayslipPrintDocument,
  RemittancePrintDocument,
  RemittanceSummaryData,
  PayrollPageData,
} from "@/features/payroll/types";
import {
  buildPayrollDifferenceDetails,
  buildPayrollRecordedVsPaidExplanation,
  buildPayrollWarningDetails,
  resolvePayrollPageFilters,
  summarizePayrollReviewItems,
} from "@/features/payroll/utils";
import type { StaffRole } from "@/lib/auth/permissions";
import type {
  SandboxPayrollAdjustment,
  SandboxSnapshot,
  SandboxStaff,
} from "@/features/sandbox/types";

export function toSandboxPayrollPageData(
  snapshot: SandboxSnapshot,
  searchParams: URLSearchParams,
): PayrollPageData {
  const filters = resolvePayrollPageFilters({
    periodSearch: searchParams.get("periodSearch") ?? undefined,
    staffSearch: searchParams.get("staffSearch") ?? undefined,
    staffFilter: searchParams.get("staffFilter") ?? undefined,
    periodStatus: searchParams.get("periodStatus") ?? undefined,
  });
  const eligible = snapshot.staff
    .filter((member) => member.status === "active" && member.isPayrollEligible)
    .sort((left, right) => left.lastName.localeCompare(right.lastName) || left.firstName.localeCompare(right.firstName));
  const excluded = snapshot.staff
    .filter((member) => member.status === "active" && !member.isPayrollEligible)
    .sort((left, right) => left.lastName.localeCompare(right.lastName) || left.firstName.localeCompare(right.firstName));
  const compensationRosterBase = eligible.map((member) => ({
    staffId: member.id,
    fullName: staffName(member),
    role: member.role,
    contactNumber: member.contactNumber,
    isPayrollEligible: member.isPayrollEligible,
    schedule: member.schedule,
    profile: toCompensationProfile(member),
  }));
  const compensationSearch = filters.staffSearch.trim().toLowerCase();
  const compensationRoster = compensationRosterBase.filter((item) => {
    if (filters.staffFilter === "missing_compensation" && item.profile) return false;
    if (filters.staffFilter === "compensation_ready" && !item.profile) return false;
    if (filters.staffFilter === "missing_schedule" && item.schedule) return false;
    if (filters.staffFilter === "schedule_ready" && !item.schedule) return false;
    if (!compensationSearch) return true;
    return [item.fullName, item.contactNumber ?? "", item.role.replaceAll("_", " ")].some((value) =>
      value.toLowerCase().includes(compensationSearch),
    );
  });
  const periods = snapshot.payrollPeriods
    .map((period) => toPeriodSummary(snapshot, period))
    .sort((left, right) => right.periodStartDate.localeCompare(left.periodStartDate) || right.createdAt.localeCompare(left.createdAt));
  const periodSearch = filters.periodSearch.trim().toLowerCase();
  const payrollPeriods = periods.filter((period) => {
    if (filters.periodStatus && period.status !== filters.periodStatus) return false;
    if (!periodSearch) return true;
    return [period.label, period.notes ?? "", period.periodStartDate, period.periodEndDate, period.payoutDate]
      .join(" ")
      .toLowerCase()
      .includes(periodSearch);
  });

  return {
    filters,
    summary: {
      eligibleStaffCount: eligible.length,
      compensatedStaffCount: compensationRosterBase.filter((item) => item.profile).length,
      missingCompensationCount: compensationRosterBase.filter((item) => !item.profile).length,
      scheduledStaffCount: compensationRosterBase.filter((item) => item.schedule).length,
      missingScheduleCount: compensationRosterBase.filter((item) => !item.schedule).length,
      configuredStaffCount: compensationRosterBase.filter((item) => item.schedule && item.profile).length,
      incompleteSetupCount: compensationRosterBase.filter((item) => !item.schedule || !item.profile).length,
      payrollPeriodCount: periods.length,
      draftPeriodCount: periods.filter((period) => period.status === "draft").length,
      processingPeriodCount: periods.filter((period) => period.status === "processing").length,
      finalizedPeriodCount: periods.filter((period) => period.status === "finalized").length,
    },
    payrollPeriods,
    compensationRoster,
    excludedPayrollStaff: excluded.map((member) => ({
      staffId: member.id,
      fullName: staffName(member),
      role: member.role,
    })),
    totalCompensationRosterCount: compensationRosterBase.length,
    visibleCompensationRosterCount: compensationRoster.length,
  };
}

export function toSandboxPayrollPeriodDetail(
  snapshot: SandboxSnapshot,
  periodId: string,
): PayrollPeriodDetailData | null {
  const period = snapshot.payrollPeriods.find((item) => item.id === periodId);
  if (!period) return null;
  const summaryPeriod = toPeriodSummary(snapshot, period);
  const items = period.generatedAt ? buildPeriodItems(snapshot, period.id) : [];
  return {
    period: summaryPeriod,
    settings: payrollSettings(snapshot),
    summary: summarizePayrollReviewItems(items),
    items,
  };
}

export function toSandboxPayrollItemBreakdown(
  snapshot: SandboxSnapshot,
  periodId: string,
  itemId: string,
): PayrollPeriodItemBreakdownData | null {
  const detail = toSandboxPayrollPeriodDetail(snapshot, periodId);
  const item = detail?.items.find((entry) => entry.id === itemId);
  if (!detail || !item) return null;
  const breakdown = computeItem(snapshot, periodId, item.staffId);
  if (!breakdown) return null;
  return {
    period: detail.period,
    settings: {
      standardDailyHours: item.standardDailyHours,
      holidayPremiumRate: item.holidayPremiumRate,
    },
    item,
    days: breakdown.days,
    recordedVsPaidExplanation: buildPayrollRecordedVsPaidExplanation({ item, days: breakdown.days }),
    differenceDetails: buildPayrollDifferenceDetails(breakdown.days),
    warningDetails: buildPayrollWarningDetails({ item, days: breakdown.days }),
  };
}

export function toSandboxPayslipPrintDocument(
  snapshot: SandboxSnapshot,
  periodId: string,
  itemId: string,
  generatedAt = new Date().toISOString(),
): PayslipPrintDocument | null {
  const detail = toSandboxPayrollPeriodDetail(snapshot, periodId);
  const item = detail?.items.find((entry) => entry.id === itemId);
  if (!detail || !item) return null;
  const staff = snapshot.staff.find((member) => member.id === item.staffId);
  return {
    period: detail.period,
    settings: detail.settings,
    item: {
      ...item,
      sssNumber: staff?.sssNumber ?? null,
      philhealthNumber: staff?.philhealthNumber ?? null,
      tinNumber: staff?.tinNumber ?? null,
      pagibigNumber: staff?.pagibigNumber ?? null,
    },
    businessProfile: toPrintBusinessProfile(snapshot),
    generatedAt,
  };
}

export function toSandboxPayrollPrintDocument(
  snapshot: SandboxSnapshot,
  periodId: string,
  generatedAt = new Date().toISOString(),
): PayrollPrintDocument | null {
  const detail = toSandboxPayrollPeriodDetail(snapshot, periodId);
  if (!detail?.period.generatedAt) return null;
  return {
    ...detail,
    businessProfile: toPrintBusinessProfile(snapshot),
    generatedAt,
  };
}

export function toSandboxRemittanceSummary(
  snapshot: SandboxSnapshot,
  monthParam?: string | null,
): RemittanceSummaryData {
  const month = resolveRemittanceMonth(monthParam);
  const includedPeriods = snapshot.payrollPeriods
    .filter(
      (period) =>
        period.status === "finalized" &&
        periodOverlapsRemittanceMonth({
          periodStartDate: period.periodStartDate,
          periodEndDate: period.periodEndDate,
          monthStartDate: month.monthStartDate,
          monthEndDate: month.monthEndDate,
        }),
    )
    .sort((left, right) => left.periodStartDate.localeCompare(right.periodStartDate) || left.label.localeCompare(right.label))
    .map((period) => ({
      id: period.id,
      label: period.label,
      periodStartDate: period.periodStartDate,
      periodEndDate: period.periodEndDate,
      payoutDate: period.payoutDate,
      finalizedAt: period.finalizedAt,
    }));

  const contributions = includedPeriods.flatMap((period) => {
    const items = buildPeriodItems(snapshot, period.id);
    return items.flatMap((item) => {
      const staff = snapshot.staff.find((member) => member.id === item.staffId);
      return item.adjustments
        .filter(
          (adjustment) =>
            adjustment.source === "system_government" &&
            adjustment.adjustmentType === "deduction" &&
            (adjustment.systemKey === "sss" ||
              adjustment.systemKey === "philhealth" ||
              adjustment.systemKey === "pagibig"),
        )
        .map((adjustment) => ({
          staffId: item.staffId,
          fullName: item.fullName,
          role: item.role,
          sssNumber: staff?.sssNumber ?? null,
          philhealthNumber: staff?.philhealthNumber ?? null,
          pagibigNumber: staff?.pagibigNumber ?? null,
          tinNumber: staff?.tinNumber ?? null,
          systemKey: adjustment.systemKey as "sss" | "philhealth" | "pagibig",
          amount: adjustment.amount,
        }));
    });
  });
  const employees = buildRemittanceEmployeeRows(contributions).map((row) => ({
    ...row,
    role: row.role as StaffRole,
  }));

  return {
    ...month,
    includedPeriods,
    employees,
    totals: summarizeRemittanceRows(employees),
    employeeCount: employees.length,
    employeesMissingIdsCount: employees.filter((employee) => employee.missingIdCount > 0).length,
  };
}

export function toSandboxRemittancePrintDocument(
  snapshot: SandboxSnapshot,
  monthParam?: string | null,
  generatedAt = new Date().toISOString(),
): RemittancePrintDocument {
  return {
    ...toSandboxRemittanceSummary(snapshot, monthParam),
    businessProfile: toPrintBusinessProfile(snapshot),
    generatedAt,
  };
}

export function generateSandboxPayrollCut(snapshot: SandboxSnapshot, periodId: string, now = new Date()) {
  const period = snapshot.payrollPeriods.find((item) => item.id === periodId);
  if (!period) {
    throw new Error("Payroll period not found.");
  }
  if (period.status === "finalized") {
    throw new Error("Finalized payroll periods are locked.");
  }

  const eligible = snapshot.staff.filter((member) => member.status === "active" && member.isPayrollEligible);
  if (eligible.length === 0) {
    throw new Error("No payroll-eligible staff were found for this branch.");
  }

  const timestamp = now.toISOString();
  const nextItems = eligible.map((member) => {
    const existing = snapshot.payrollItems.find((item) => item.periodId === periodId && item.staffId === member.id);
    return {
      id: existing?.id ?? crypto.randomUUID(),
      periodId,
      staffId: member.id,
      fullName: staffName(member),
      role: member.role,
      netPay: 0,
      grossPay: 0,
      basePay: 0,
      presentCount: 0,
      warningCodes: [],
    };
  });
  const withItems: SandboxSnapshot = {
    ...snapshot,
    payrollPeriods: snapshot.payrollPeriods.map((item) =>
      item.id === periodId ? { ...item, generatedAt: timestamp, updatedAt: timestamp } : item,
    ),
    payrollItems: [...snapshot.payrollItems.filter((item) => item.periodId !== periodId), ...nextItems],
  };
  return syncGovernmentAdjustments(withItems, periodId, now);
}

export function updateSandboxPayrollPeriodStatus(
  snapshot: SandboxSnapshot,
  periodId: string,
  status: SandboxSnapshot["payrollPeriods"][number]["status"],
  now = new Date(),
) {
  const period = snapshot.payrollPeriods.find((item) => item.id === periodId);
  if (!period) {
    throw new Error("Payroll period not found.");
  }
  if (period.status === "finalized") {
    throw new Error("Finalized payroll periods are locked.");
  }
  if (status !== "draft" && !period.generatedAt) {
    throw new Error("Generate the payroll cut before locking or finalizing this period.");
  }

  const timestamp = now.toISOString();
  return {
    ...snapshot,
    payrollPeriods: snapshot.payrollPeriods.map((item) =>
      item.id === periodId
        ? {
            ...item,
            status,
            finalizedAt: status === "finalized" ? timestamp : null,
            updatedAt: timestamp,
          }
        : item,
    ),
  };
}

export function saveSandboxCompensationProfile(
  snapshot: SandboxSnapshot,
  values: {
    staffId: string;
    payBasis: NonNullable<SandboxStaff["compensation"]>["payBasis"];
    baseRate: string;
    overtimeRate: string;
    allowancePerPeriod: string;
    effectiveStartDate: string;
    exemptFromAttendance: boolean;
    useShopDefaultContributions: boolean;
    sssAmount: string;
    philhealthAmount: string;
    pagibigAmount: string;
    notes: string;
  },
) {
  const member = snapshot.staff.find((item) => item.id === values.staffId);
  if (!member) {
    throw new Error("Staff member was not found in the sample shop.");
  }

  return {
    ...snapshot,
    staff: snapshot.staff.map((item) =>
      item.id === values.staffId
        ? {
            ...item,
            compensation: {
              payBasis: values.payBasis,
              baseRate: Number(values.baseRate),
              overtimeRate: values.overtimeRate.trim() ? Number(values.overtimeRate) : null,
              allowancePerPeriod: Number(values.allowancePerPeriod),
              effectiveStartDate: values.effectiveStartDate,
              exemptFromAttendance: values.exemptFromAttendance,
              useShopDefaultContributions: values.useShopDefaultContributions,
              sssAmount: values.sssAmount.trim() ? Number(values.sssAmount) : null,
              philhealthAmount: values.philhealthAmount.trim() ? Number(values.philhealthAmount) : null,
              pagibigAmount: values.pagibigAmount.trim() ? Number(values.pagibigAmount) : null,
              notes: values.notes.trim() || null,
            },
          }
        : item,
    ),
  };
}

export function saveSandboxPayrollAdjustment(
  snapshot: SandboxSnapshot,
  values: {
    payrollPeriodId: string;
    payrollPeriodItemId: string;
    adjustmentType: "addition" | "deduction";
    label: string;
    amount: string;
    notes: string;
  },
  now = new Date(),
) {
  const period = snapshot.payrollPeriods.find((item) => item.id === values.payrollPeriodId);
  const item = snapshot.payrollItems.find((entry) => entry.id === values.payrollPeriodItemId);
  if (!period || !item || item.periodId !== period.id) {
    throw new Error("Payroll row not found.");
  }
  if (period.status === "finalized") {
    throw new Error("Finalized payroll periods are locked.");
  }
  if (isReservedGovernmentAdjustmentLabel(values.label)) {
    throw new Error("SSS, PhilHealth, and Pag-IBIG are applied from compensation settings.");
  }

  const timestamp = now.toISOString();
  const adjustment: SandboxPayrollAdjustment = {
    id: crypto.randomUUID(),
    periodId: period.id,
    staffId: item.staffId,
    adjustmentType: values.adjustmentType,
    label: values.label.trim(),
    amount: Number(values.amount),
    notes: values.notes.trim() || null,
    source: "manual",
    systemKey: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...snapshot,
    payrollAdjustments: [...snapshot.payrollAdjustments, adjustment],
  };
}

export function deleteSandboxPayrollAdjustment(
  snapshot: SandboxSnapshot,
  adjustmentId: string,
  periodId: string,
) {
  const adjustment = snapshot.payrollAdjustments.find((item) => item.id === adjustmentId && item.periodId === periodId);
  if (!adjustment) {
    throw new Error("Payroll adjustment not found.");
  }
  if (adjustment.source === "system_government") {
    throw new Error("Government contributions are updated when the payroll cut is generated.");
  }
  const period = snapshot.payrollPeriods.find((item) => item.id === periodId);
  if (period?.status === "finalized") {
    throw new Error("Finalized payroll periods are locked.");
  }

  return {
    ...snapshot,
    payrollAdjustments: snapshot.payrollAdjustments.filter((item) => item.id !== adjustmentId),
  };
}

function syncGovernmentAdjustments(snapshot: SandboxSnapshot, periodId: string, now: Date) {
  const period = snapshot.payrollPeriods.find((item) => item.id === periodId);
  if (!period) return snapshot;
  const timestamp = now.toISOString();
  const itemStaffIds = new Set(
    snapshot.payrollItems.filter((item) => item.periodId === periodId).map((item) => item.staffId),
  );
  const kept = snapshot.payrollAdjustments.filter(
    (adjustment) =>
      adjustment.periodId !== periodId ||
      !itemStaffIds.has(adjustment.staffId) ||
      adjustment.source !== "system_government",
  );
  if (!period.applyGovernmentDeductions) {
    return { ...snapshot, payrollAdjustments: kept };
  }

  const shopDefaults = governmentDefaults(snapshot);
  const systemAdjustments = snapshot.payrollItems
    .filter((item) => item.periodId === periodId)
    .flatMap((item) => {
      const member = snapshot.staff.find((staff) => staff.id === item.staffId);
      const resolved = resolveGovernmentContributions({
        shopDefaults,
        profile: member?.compensation
          ? {
              useShopDefaultContributions: member.compensation.useShopDefaultContributions,
              sssAmount: member.compensation.sssAmount,
              philhealthAmount: member.compensation.philhealthAmount,
              pagibigAmount: member.compensation.pagibigAmount,
            }
          : null,
      });
      return governmentContributionEntries(resolved).map((entry) => ({
        id: crypto.randomUUID(),
        periodId,
        staffId: item.staffId,
        adjustmentType: "deduction" as const,
        label: entry.label,
        amount: entry.amount,
        notes: null,
        source: "system_government" as const,
        systemKey: entry.key,
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
    });

  return {
    ...snapshot,
    payrollAdjustments: [...kept, ...systemAdjustments],
  };
}

function buildPeriodItems(snapshot: SandboxSnapshot, periodId: string): PayrollPeriodItemSummary[] {
  return snapshot.payrollItems
    .filter((item) => item.periodId === periodId)
    .flatMap((item) => {
      const computed = computeItem(snapshot, periodId, item.staffId);
      if (!computed) return [];
      const {
        approvedLeavePaidDayCount: _approvedLeavePaidDayCount,
        workedDuringLeaveDayCount: _workedDuringLeaveDayCount,
        approvedLeavePay: _approvedLeavePay,
        workedDuringLeavePremiumPay: _workedDuringLeavePremiumPay,
        ...summary
      } = computed.item;
      return [
        {
          id: item.id,
          payrollPeriodId: periodId,
          branchId: snapshot.branch.id,
          ...summary,
          adjustments: adjustmentsFor(snapshot, periodId, item.staffId),
        },
      ];
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

function computeItem(snapshot: SandboxSnapshot, periodId: string, staffId: string) {
  const period = snapshot.payrollPeriods.find((item) => item.id === periodId);
  const member = snapshot.staff.find((item) => item.id === staffId);
  if (!period || !member) return null;
  const adjustments = adjustmentsFor(snapshot, periodId, staffId);
  return computePayrollItemBreakdown({
    staffId: member.id,
    fullName: staffName(member),
    role: member.role,
    schedule: member.schedule,
    compensationProfile: toCompensationProfile(member),
    attendanceRecords: snapshot.attendance
      .filter(
        (record) =>
          record.staffId === member.id &&
          record.attendanceDate >= period.periodStartDate &&
          record.attendanceDate <= period.periodEndDate,
      )
      .map((record) => ({
        attendanceDate: record.attendanceDate,
        status: record.status,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        approvedAt: record.approvedAt,
      })),
    holidays: snapshot.holidays.map(
      (holiday): PayrollHolidayRule => ({
        holidayDate: holiday.holidayDate,
        label: holiday.label,
        holidayKind: holiday.holidayKind,
        payTreatment: holiday.payTreatment,
      }),
    ),
    leaveEntries: [],
    periodStartDate: period.periodStartDate,
    periodEndDate: period.periodEndDate,
    settings: payrollSettings(snapshot),
    manualAdditionsTotal: sumAdjustments(adjustments, "addition"),
    manualDeductionsTotal: sumAdjustments(adjustments, "deduction"),
  });
}

function adjustmentsFor(snapshot: SandboxSnapshot, periodId: string, staffId: string): PayrollPeriodItemAdjustmentSummary[] {
  const item = snapshot.payrollItems.find((entry) => entry.periodId === periodId && entry.staffId === staffId);
  if (!item) return [];
  return snapshot.payrollAdjustments
    .filter((adjustment) => adjustment.periodId === periodId && adjustment.staffId === staffId)
    .map((adjustment) => ({
      id: adjustment.id,
      payrollPeriodItemId: item.id,
      adjustmentType: adjustment.adjustmentType,
      label: adjustment.label,
      amount: adjustment.amount,
      notes: adjustment.notes,
      source: adjustment.source,
      systemKey: adjustment.systemKey,
      createdAt: adjustment.createdAt,
      updatedAt: adjustment.updatedAt,
    }));
}

function toPeriodSummary(
  snapshot: SandboxSnapshot,
  period: SandboxSnapshot["payrollPeriods"][number],
): PayrollPeriodSummary {
  return {
    id: period.id,
    branchId: snapshot.branch.id,
    label: period.label,
    periodStartDate: period.periodStartDate,
    periodEndDate: period.periodEndDate,
    payoutDate: period.payoutDate,
    status: period.status,
    notes: period.notes,
    applyGovernmentDeductions: period.applyGovernmentDeductions,
    createdByStaffId: null,
    generatedByStaffId: period.generatedAt ? snapshot.staff.find((member) => member.role === "owner")?.id ?? null : null,
    generatedAt: period.generatedAt,
    finalizedByStaffId: period.finalizedAt ? snapshot.staff.find((member) => member.role === "owner")?.id ?? null : null,
    finalizedAt: period.finalizedAt,
    createdAt: period.createdAt,
    updatedAt: period.updatedAt,
  };
}

function toCompensationProfile(member: SandboxStaff): CompensationProfileSummary | null {
  if (!member.compensation) return null;
  return {
    id: `${member.id}-compensation`,
    staffId: member.id,
    payBasis: member.compensation.payBasis,
    baseRate: member.compensation.baseRate,
    overtimeRate: member.compensation.overtimeRate,
    allowancePerPeriod: member.compensation.allowancePerPeriod,
    effectiveStartDate: member.compensation.effectiveStartDate,
    exemptFromAttendance: member.compensation.exemptFromAttendance,
    useShopDefaultContributions: member.compensation.useShopDefaultContributions,
    sssAmount: member.compensation.sssAmount,
    philhealthAmount: member.compensation.philhealthAmount,
    pagibigAmount: member.compensation.pagibigAmount,
    notes: member.compensation.notes,
  };
}

function payrollSettings(snapshot: SandboxSnapshot) {
  return {
    standardDailyHours: Number(snapshot.business.payrollStandardDailyHours) || 8,
    holidayPremiumRate: Number(snapshot.business.payrollHolidayPremiumRate) || 0,
  };
}

function governmentDefaults(snapshot: SandboxSnapshot) {
  return {
    sssAmount: Number(snapshot.business.payrollDefaultSssAmount) || 0,
    philhealthAmount: Number(snapshot.business.payrollDefaultPhilhealthAmount) || 0,
    pagibigAmount: Number(snapshot.business.payrollDefaultPagibigAmount) || 0,
  };
}

function sumAdjustments(adjustments: PayrollPeriodItemAdjustmentSummary[], type: "addition" | "deduction") {
  return adjustments.filter((adjustment) => adjustment.adjustmentType === type).reduce((sum, adjustment) => sum + adjustment.amount, 0);
}

function staffName(member: SandboxStaff) {
  return `${member.firstName} ${member.lastName}`.trim();
}

function toPrintBusinessProfile(snapshot: SandboxSnapshot) {
  return {
    businessName: snapshot.business.name,
    businessLogoUrl: snapshot.business.logoDataUrl,
    businessVatRegistrationNo: snapshot.business.vatRegistrationNo || null,
    businessContact: snapshot.business.contact || null,
    businessEmail: snapshot.business.email || null,
    businessAddress: snapshot.business.address || null,
    websiteUrl: null,
    facebookLabel: null,
  };
}
