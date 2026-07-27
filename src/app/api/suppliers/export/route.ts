import { listSupplierSpreadsheetRows } from "@/features/suppliers/export/supplier-export";
import { buildSpreadsheetExportResponse } from "@/lib/spreadsheet/spreadsheet-export-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await listSupplierSpreadsheetRows();
    return buildSpreadsheetExportResponse("suppliers-export.xlsx", "suppliers", rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export suppliers.";
    return new Response(message, { status: 500 });
  }
}
