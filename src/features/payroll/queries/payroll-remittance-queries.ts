import { DateTime } from "luxon";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { buildPrintBusinessProfile } from "@/lib/branding/print-business-profile";
import {
  buildRemittanceEmployeeRows,
  resolveRemittanceMonth,
  summarizeRemittanceRows,
  type RemittanceEmployeeContributionInput,
} from "@/features/payroll/remittance-summary";
import type {
  RemittanceIncludedPeriod,
  RemittancePrintDocument,
  RemittanceSummaryData,
} from "@/features/payroll/types";
import type { StaffRole } from "@/lib/auth/permissions";
import type { TableRow } from "@/types/database";

type PayrollPeriodRow = Pick<
  TableRow<"payroll_periods">,
  | "id"
  | "label"
  | "period_start_date"
  | "period_end_date"
  | "payout_date"
  | "finalized_at"
  | "branch_id"
  | "status"
>;
type PayrollPeriodItemRow = Pick<
  TableRow<"payroll_period_items">,
  "id" | "payroll_period_id" | "staff_id" | "staff_name" | "staff_role"
>;
type AdjustmentRow = Pick<
  TableRow<"payroll_period_item_adjustments">,
  "payroll_period_item_id" | "amount" | "source" | "system_key" | "adjustment_type"
>;
type StaffIdRow = Pick<
  TableRow<"staff">,
  "id" | "sss_number" | "philhealth_number" | "pagibig_number" | "tin_number"
>;

export async function getRemittanceSummaryData(
  monthParam?: string | null,
): Promise<RemittanceSummaryData> {
  const month = resolveRemittanceMonth(monthParam);
  const { branchScope, supabase } = await getBranchScopedServerClient("payroll:read");

  const { data: periodData, error: periodError } = await applyBranchFilter(
    supabase
      .from("payroll_periods")
      .select("id, label, period_start_date, period_end_date, payout_date, finalized_at, branch_id, status")
      .eq("status", "finalized")
      .lte("period_start_date", month.monthEndDate)
      .gte("period_end_date", month.monthStartDate)
      .order("period_start_date", { ascending: true })
      .order("label", { ascending: true }),
    branchScope.selectedBranchId,
  );

  if (periodError) {
    throw new Error(periodError.message);
  }

  const periods = (periodData ?? []) as PayrollPeriodRow[];
  const includedPeriods: RemittanceIncludedPeriod[] = periods.map((period) => ({
    id: period.id,
    label: period.label,
    periodStartDate: period.period_start_date,
    periodEndDate: period.period_end_date,
    payoutDate: period.payout_date,
    finalizedAt: period.finalized_at,
  }));

  if (periods.length === 0) {
    return {
      ...month,
      includedPeriods: [],
      employees: [],
      totals: { sssAmount: 0, philhealthAmount: 0, pagibigAmount: 0, totalAmount: 0 },
      employeeCount: 0,
      employeesMissingIdsCount: 0,
    };
  }

  const periodIds = periods.map((period) => period.id);
  const { data: itemData, error: itemError } = await supabase
    .from("payroll_period_items")
    .select("id, payroll_period_id, staff_id, staff_name, staff_role")
    .in("payroll_period_id", periodIds);

  if (itemError) {
    throw new Error(itemError.message);
  }

  const items = (itemData ?? []) as PayrollPeriodItemRow[];
  if (items.length === 0) {
    return {
      ...month,
      includedPeriods,
      employees: [],
      totals: { sssAmount: 0, philhealthAmount: 0, pagibigAmount: 0, totalAmount: 0 },
      employeeCount: 0,
      employeesMissingIdsCount: 0,
    };
  }

  const itemIds = items.map((item) => item.id);
  const staffIds = Array.from(new Set(items.map((item) => item.staff_id)));

  const [
    { data: adjustmentData, error: adjustmentError },
    { data: staffData, error: staffError },
  ] = await Promise.all([
    supabase
      .from("payroll_period_item_adjustments")
      .select("payroll_period_item_id, amount, source, system_key, adjustment_type")
      .in("payroll_period_item_id", itemIds)
      .eq("source", "system_government")
      .eq("adjustment_type", "deduction"),
    supabase
      .from("staff")
      .select("id, sss_number, philhealth_number, pagibig_number, tin_number")
      .in("id", staffIds),
  ]);

  if (adjustmentError) {
    throw new Error(adjustmentError.message);
  }

  if (staffError) {
    throw new Error(staffError.message);
  }

  const staffById = new Map(
    ((staffData ?? []) as StaffIdRow[]).map((row) => [row.id, row]),
  );
  const itemById = new Map(items.map((item) => [item.id, item]));

  const contributions: RemittanceEmployeeContributionInput[] = [];
  for (const adjustment of (adjustmentData ?? []) as AdjustmentRow[]) {
    const systemKey = adjustment.system_key;
    if (systemKey !== "sss" && systemKey !== "philhealth" && systemKey !== "pagibig") {
      continue;
    }

    const item = itemById.get(adjustment.payroll_period_item_id);
    if (!item) {
      continue;
    }

    const staff = staffById.get(item.staff_id);

    contributions.push({
      staffId: item.staff_id,
      fullName: item.staff_name,
      role: item.staff_role,
      sssNumber: staff?.sss_number ?? null,
      philhealthNumber: staff?.philhealth_number ?? null,
      pagibigNumber: staff?.pagibig_number ?? null,
      tinNumber: staff?.tin_number ?? null,
      systemKey,
      amount: adjustment.amount,
    });
  }

  const employees = buildRemittanceEmployeeRows(contributions).map((row) => ({
    ...row,
    role: row.role as StaffRole,
  }));
  const totals = summarizeRemittanceRows(employees);

  return {
    ...month,
    includedPeriods,
    employees,
    totals,
    employeeCount: employees.length,
    employeesMissingIdsCount: employees.filter((employee) => employee.missingIdCount > 0).length,
  };
}

export async function getRemittancePrintDocument(
  monthParam?: string | null,
): Promise<RemittancePrintDocument> {
  const summary = await getRemittanceSummaryData(monthParam);
  const { context, supabase, branchScope } = await getBranchScopedServerClient("payroll:read");

  const [{ data: settingsRow, error }, { data: tenantBranding, error: brandingError }] =
    await Promise.all([
      supabase
        .from("business_settings")
        .select(
          "business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at",
        )
        .eq("branch_id", branchScope.selectedBranchId ?? branchScope.writeBranchId)
        .maybeSingle(),
      supabase
        .from("tenant_branding")
        .select("website_url, facebook_label")
        .eq("tenant_id", context.tenantId)
        .maybeSingle(),
    ]);

  if (error) {
    throw new Error(error.message);
  }

  if (brandingError) {
    throw new Error(brandingError.message);
  }

  return {
    ...summary,
    businessProfile: buildPrintBusinessProfile(settingsRow, tenantBranding),
    generatedAt: DateTime.now().setZone("Asia/Manila").toISO() ?? new Date().toISOString(),
  };
}
