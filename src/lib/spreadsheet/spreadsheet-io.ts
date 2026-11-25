import * as XLSX from "xlsx";

export const SPREADSHEET_MAX_ROWS = 1000;
export const SPREADSHEET_MAX_FILE_BYTES = 5 * 1024 * 1024;

export function validateSpreadsheetUpload(file: unknown) {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, message: "Choose a .csv or .xlsx file to import." };
  }

  if (file.size > SPREADSHEET_MAX_FILE_BYTES) {
    return { ok: false as const, message: "Import files must be 5 MB or smaller." };
  }

  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
    return {
      ok: false as const,
      message: "Only .csv, .xlsx, or .xls files are supported.",
    };
  }

  return { ok: true as const, file };
}

export function readSpreadsheetRows(
  buffer: ArrayBuffer,
  options?: { preferredSheetName?: string; maxRows?: number },
) {
  const maxRows = options?.maxRows ?? SPREADSHEET_MAX_ROWS;
  // codepage 65001 = UTF-8 so CSV peso signs (₱) are not read as mojibake.
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true, codepage: 65001 });
  const preferred = options?.preferredSheetName?.trim().toLowerCase();
  const sheetName =
    workbook.SheetNames.find((name) => name.trim().toLowerCase() === preferred) ??
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The file does not contain any worksheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });

  if (rawRows.length > maxRows) {
    throw new Error(`Too many rows (${rawRows.length}). Import up to ${maxRows} rows at a time.`);
  }

  return { sheetName, rawRows };
}

export function buildXlsxBuffer(sheetName: string, rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildCsvTemplateContent(headers: readonly string[], sampleRow?: readonly string[]) {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replaceAll('"', '""')}"`;
    }

    return value;
  };

  const lines = [headers.map(escape).join(",")];

  if (sampleRow) {
    lines.push(sampleRow.map(escape).join(","));
  }

  return `${lines.join("\n")}\n`;
}

export function normalizeSpreadsheetHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function cleanSpreadsheetText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

export function mapSpreadsheetHeaders(
  rawRow: Record<string, unknown>,
  aliases: Record<string, string>,
) {
  const mapped: Record<string, unknown> = {};

  for (const [header, cellValue] of Object.entries(rawRow)) {
    const canonical = aliases[normalizeSpreadsheetHeader(header)];

    if (canonical) {
      mapped[canonical] = cellValue;
    }
  }

  return mapped;
}

export function isBlankSpreadsheetRow(mapped: Record<string, unknown>) {
  return Object.values(mapped).every((value) => cleanSpreadsheetText(value) === "");
}

/**
 * Accepts plain numbers and common spreadsheet money text (₱1,250.00, PHP 100, etc.).
 * Empty/missing values return `fallback`.
 */
export function parseSpreadsheetNonNegativeNumber(
  value: unknown,
  fallback: number | null = null,
): number | null {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (value instanceof Date) {
    return null;
  }

  // Keep digits/decimal only after stripping currency text (including UTF-8 peso
  // misread as Latin-1 mojibake: â\u0082±).
  const text = String(value)
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/â\u0082±/g, "")
    .replace(/^(php|php\.?|usd)\s*/i, "")
    .replace(/[₱$€£¥]/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "");

  if (!text) {
    return fallback;
  }

  if (/^\(.*\)$/.test(text)) {
    return null;
  }

  const match = text.match(/^\d+(?:\.\d+)?$/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
