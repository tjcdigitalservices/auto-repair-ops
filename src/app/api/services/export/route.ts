import { listServiceSpreadsheetRows } from "@/features/services/export/service-export";
import { buildSpreadsheetExportResponse } from "@/lib/spreadsheet/spreadsheet-export-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await listServiceSpreadsheetRows();
    return buildSpreadsheetExportResponse("services-export.xlsx", "services", rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export services.";
    return new Response(message, { status: 500 });
  }
}
