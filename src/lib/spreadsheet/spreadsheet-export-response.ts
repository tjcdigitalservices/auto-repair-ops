import { buildXlsxBuffer } from "@/lib/spreadsheet/spreadsheet-io";

export function buildSpreadsheetExportResponse(
  filename: string,
  sheetName: string,
  rows: Record<string, unknown>[],
) {
  const buffer = buildXlsxBuffer(sheetName, rows);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
