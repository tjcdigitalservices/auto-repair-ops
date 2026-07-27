import {
  cleanSpreadsheetText,
  isBlankSpreadsheetRow,
  mapSpreadsheetHeaders,
  readSpreadsheetRows,
} from "@/lib/spreadsheet/spreadsheet-io";
import { SERVICE_IMPORT_HEADER_ALIASES } from "@/features/services/import/service-import-constants";

export type ParsedServiceImportRow = {
  name: string;
  category: string;
  description: string;
  laborPrice: number;
  estimatedDurationMinutes: number | null;
  status: "active" | "inactive";
};

type RowResult =
  | { ok: true; row: ParsedServiceImportRow }
  | { ok: false; rowNumber: number; message: string };

export function parseServiceImportWorkbook(buffer: ArrayBuffer) {
  const { rawRows } = readSpreadsheetRows(buffer, { preferredSheetName: "services" });
  const rows = rawRows.flatMap((rawRow, index) => mapRawRow(rawRow, index + 2));
  const validRows = rows.flatMap((row) => (row.ok ? [row.row] : []));
  const invalidRows = rows.flatMap((row) =>
    row.ok ? [] : [{ rowNumber: row.rowNumber, message: row.message }],
  );

  return { validRows, invalidRows };
}

function mapRawRow(rawRow: Record<string, unknown>, rowNumber: number): RowResult[] {
  const mapped = mapSpreadsheetHeaders(rawRow, SERVICE_IMPORT_HEADER_ALIASES);

  if (isBlankSpreadsheetRow(mapped)) {
    return [];
  }

  const name = cleanSpreadsheetText(mapped.name);
  if (!name) {
    return [{ ok: false, rowNumber, message: "Service Name is required." }];
  }

  const laborPrice = parseNonNegativeNumber(mapped.laborPrice);
  if (laborPrice === null) {
    return [{ ok: false, rowNumber, message: "Labor Price must be a non-negative number." }];
  }

  const durationRaw = cleanSpreadsheetText(mapped.estimatedDurationMinutes);
  let estimatedDurationMinutes: number | null = null;

  if (durationRaw) {
    const parsed = Number.parseInt(durationRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return [{ ok: false, rowNumber, message: "Duration (minutes) must be a whole number." }];
    }

    estimatedDurationMinutes = parsed;
  }

  const status = parseStatus(mapped.status);
  if (!status) {
    return [{ ok: false, rowNumber, message: "Status must be active or inactive." }];
  }

  return [
    {
      ok: true,
      row: {
        name,
        category: cleanSpreadsheetText(mapped.category),
        description: cleanSpreadsheetText(mapped.description),
        laborPrice,
        estimatedDurationMinutes,
        status,
      },
    },
  ];
}

function parseNonNegativeNumber(value: unknown) {
  const text = cleanSpreadsheetText(value);
  if (!text) {
    return 0;
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseStatus(value: unknown): "active" | "inactive" | null {
  const normalized = cleanSpreadsheetText(value).toLowerCase();

  if (!normalized || normalized === "active") {
    return "active";
  }

  if (normalized === "inactive") {
    return "inactive";
  }

  return null;
}
