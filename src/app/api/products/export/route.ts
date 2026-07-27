import { listProductSpreadsheetRows } from "@/features/products/export/product-export";
import { buildSpreadsheetExportResponse } from "@/lib/spreadsheet/spreadsheet-export-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await listProductSpreadsheetRows();
    return buildSpreadsheetExportResponse("products-export.xlsx", "products", rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export products.";
    return new Response(message, { status: 500 });
  }
}
