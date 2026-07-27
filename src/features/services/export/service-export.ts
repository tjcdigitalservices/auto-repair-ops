import { getBranchScopedServerClient } from "@/lib/branches";
import {
  applyCatalogVisibilityFilter,
  getCatalogSharingSettings,
} from "@/lib/catalog-visibility";
import type { TableRow } from "@/types/database";

type ServiceRow = TableRow<"services">;

export async function listServiceSpreadsheetRows() {
  const { branchScope, supabase } = await getBranchScopedServerClient("services:read");
  const sharingSettings = await getCatalogSharingSettings(supabase, branchScope.selectedBranchId);
  const { data, error } = await applyCatalogVisibilityFilter(
    supabase.from("services").select("*").order("name", { ascending: true }),
    {
      branchId: branchScope.selectedBranchId,
      includeGlobal: sharingSettings.allowGlobalServiceCatalog,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ServiceRow[]).map((row) => ({
    "Service Name": row.name,
    Category: row.category ?? "",
    Description: row.description ?? "",
    "Labor Price": row.labor_price,
    "Duration (minutes)": row.estimated_duration_minutes ?? "",
    Status: row.status,
  }));
}
