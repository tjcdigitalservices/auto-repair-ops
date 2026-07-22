import { getBranchScopedServerClient } from "@/lib/branches";
import {
  dedupeLaborPickerOptions,
  mapLaborSourceRowToPickerOption,
} from "@/features/labor/picker-mappers";
import type { LaborPickerOption } from "@/features/labor/types";

type LaborSourceRow = {
  description: string;
  unit_price: number;
};

export async function listLaborPickerOptions(): Promise<LaborPickerOption[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("quotations:read");
  const branchId = branchScope.selectedBranchId;

  if (!branchId) {
    return [];
  }

  const [quotationLaborResult, jobOrderLaborResult] = await Promise.all([
    supabase
      .from("quotation_items")
      .select("description, unit_price, quotations!inner(branch_id)")
      .eq("item_type", "labor")
      .eq("quotations.branch_id", branchId)
      .order("description", { ascending: true }),
    supabase
      .from("job_order_items")
      .select("description, unit_price, job_orders!inner(branch_id)")
      .eq("item_type", "labor")
      .eq("job_orders.branch_id", branchId),
  ]);

  if (quotationLaborResult.error) {
    throw new Error(quotationLaborResult.error.message);
  }

  if (jobOrderLaborResult.error) {
    throw new Error(jobOrderLaborResult.error.message);
  }

  const rows = [
    ...((quotationLaborResult.data ?? []) as LaborSourceRow[]),
    ...((jobOrderLaborResult.data ?? []) as LaborSourceRow[]),
  ];

  return dedupeLaborPickerOptions(rows.map(mapLaborSourceRowToPickerOption));
}
