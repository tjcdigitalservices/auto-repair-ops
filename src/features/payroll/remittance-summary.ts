import { DateTime } from "luxon";

import {
  GOVERNMENT_CONTRIBUTION_KEYS,
  type GovernmentContributionKey,
} from "@/features/payroll/government-contributions";
import { getBusinessNow } from "@/lib/dates";

export type RemittanceMonthSelection = {
  month: string;
  monthLabel: string;
  monthStartDate: string;
  monthEndDate: string;
};

export type RemittanceContributionTotals = {
  sssAmount: number;
  philhealthAmount: number;
  pagibigAmount: number;
  totalAmount: number;
};

export type RemittanceEmployeeContributionInput = {
  staffId: string;
  fullName: string;
  role: string;
  sssNumber: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  tinNumber: string | null;
  systemKey: GovernmentContributionKey;
  amount: number;
};

export type RemittanceEmployeeRow = {
  staffId: string;
  fullName: string;
  role: string;
  sssNumber: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  tinNumber: string | null;
  sssAmount: number;
  philhealthAmount: number;
  pagibigAmount: number;
  totalAmount: number;
  missingIdCount: number;
};

export function resolveRemittanceMonth(monthParam?: string | null): RemittanceMonthSelection {
  const parsed = monthParam?.trim()
    ? DateTime.fromFormat(monthParam.trim(), "yyyy-LL", { zone: "Asia/Manila" })
    : null;
  const targetMonth =
    parsed?.isValid ? parsed.startOf("month") : getBusinessNow().startOf("month");

  return {
    month: targetMonth.toFormat("yyyy-LL"),
    monthLabel: targetMonth.toFormat("LLLL yyyy"),
    monthStartDate: targetMonth.startOf("month").toFormat("yyyy-LL-dd"),
    monthEndDate: targetMonth.endOf("month").toFormat("yyyy-LL-dd"),
  };
}

export function periodOverlapsRemittanceMonth(params: {
  periodStartDate: string;
  periodEndDate: string;
  monthStartDate: string;
  monthEndDate: string;
}) {
  return (
    params.periodStartDate <= params.monthEndDate &&
    params.periodEndDate >= params.monthStartDate
  );
}

export function buildRemittanceEmployeeRows(
  contributions: RemittanceEmployeeContributionInput[],
): RemittanceEmployeeRow[] {
  const byStaffId = new Map<string, RemittanceEmployeeRow>();

  for (const contribution of contributions) {
    if (!GOVERNMENT_CONTRIBUTION_KEYS.includes(contribution.systemKey)) {
      continue;
    }

    const amount = roundMoney(contribution.amount);
    if (amount <= 0) {
      continue;
    }

    const existing = byStaffId.get(contribution.staffId);
    if (!existing) {
      const row: RemittanceEmployeeRow = {
        staffId: contribution.staffId,
        fullName: contribution.fullName,
        role: contribution.role,
        sssNumber: contribution.sssNumber,
        philhealthNumber: contribution.philhealthNumber,
        pagibigNumber: contribution.pagibigNumber,
        tinNumber: contribution.tinNumber,
        sssAmount: 0,
        philhealthAmount: 0,
        pagibigAmount: 0,
        totalAmount: 0,
        missingIdCount: 0,
      };
      applyContribution(row, contribution.systemKey, amount);
      byStaffId.set(contribution.staffId, row);
      continue;
    }

    applyContribution(existing, contribution.systemKey, amount);
  }

  return Array.from(byStaffId.values())
    .map((row) => ({
      ...row,
      sssAmount: roundMoney(row.sssAmount),
      philhealthAmount: roundMoney(row.philhealthAmount),
      pagibigAmount: roundMoney(row.pagibigAmount),
      totalAmount: roundMoney(row.sssAmount + row.philhealthAmount + row.pagibigAmount),
      missingIdCount: countMissingIds(row),
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export function summarizeRemittanceRows(rows: RemittanceEmployeeRow[]): RemittanceContributionTotals {
  return rows.reduce<RemittanceContributionTotals>(
    (totals, row) => ({
      sssAmount: roundMoney(totals.sssAmount + row.sssAmount),
      philhealthAmount: roundMoney(totals.philhealthAmount + row.philhealthAmount),
      pagibigAmount: roundMoney(totals.pagibigAmount + row.pagibigAmount),
      totalAmount: roundMoney(totals.totalAmount + row.totalAmount),
    }),
    { sssAmount: 0, philhealthAmount: 0, pagibigAmount: 0, totalAmount: 0 },
  );
}

function applyContribution(
  row: RemittanceEmployeeRow,
  systemKey: GovernmentContributionKey,
  amount: number,
) {
  if (systemKey === "sss") {
    row.sssAmount += amount;
    return;
  }

  if (systemKey === "philhealth") {
    row.philhealthAmount += amount;
    return;
  }

  row.pagibigAmount += amount;
}

function countMissingIds(row: Pick<
  RemittanceEmployeeRow,
  "sssNumber" | "philhealthNumber" | "pagibigNumber"
>) {
  return [row.sssNumber, row.philhealthNumber, row.pagibigNumber].filter(
    (value) => !value?.trim(),
  ).length;
}

function roundMoney(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(4));
}
