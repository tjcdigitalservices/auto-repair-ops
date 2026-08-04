import type { PayrollPeriodItemBreakdownData } from "@/features/payroll/types";

export async function fetchPayrollItemBreakdown(periodId: string, itemId: string) {
  const response = await fetch(`/api/payroll/${periodId}/items/${itemId}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Unable to load payroll details.");
  }

  return (await response.json()) as PayrollPeriodItemBreakdownData;
}
