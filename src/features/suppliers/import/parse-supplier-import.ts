import {
  cleanSpreadsheetText,
  isBlankSpreadsheetRow,
  mapSpreadsheetHeaders,
  readSpreadsheetRows,
} from "@/lib/spreadsheet/spreadsheet-io";
import { SUPPLIER_IMPORT_HEADER_ALIASES } from "@/features/suppliers/import/supplier-import-constants";

export type ParsedSupplierImportRow = {
  supplierName: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  address: string;
  paymentTerms: string;
  notes: string;
  status: "active" | "inactive";
};

type RowResult =
  | { ok: true; row: ParsedSupplierImportRow }
  | { ok: false; rowNumber: number; message: string };

export function parseSupplierImportWorkbook(buffer: ArrayBuffer) {
  const { rawRows } = readSpreadsheetRows(buffer, { preferredSheetName: "suppliers" });
  const rows = rawRows.flatMap((rawRow, index) => mapRawRow(rawRow, index + 2));
  const validRows = rows.flatMap((row) => (row.ok ? [row.row] : []));
  const invalidRows = rows.flatMap((row) =>
    row.ok ? [] : [{ rowNumber: row.rowNumber, message: row.message }],
  );

  return { validRows, invalidRows };
}

function mapRawRow(rawRow: Record<string, unknown>, rowNumber: number): RowResult[] {
  const mapped = mapSpreadsheetHeaders(rawRow, SUPPLIER_IMPORT_HEADER_ALIASES);

  if (isBlankSpreadsheetRow(mapped)) {
    return [];
  }

  const supplierName = cleanSpreadsheetText(mapped.supplierName);
  if (!supplierName) {
    return [{ ok: false, rowNumber, message: "Supplier Name is required." }];
  }

  const status = parseStatus(mapped.status);
  if (!status) {
    return [{ ok: false, rowNumber, message: "Status must be active or inactive." }];
  }

  const email = cleanSpreadsheetText(mapped.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return [{ ok: false, rowNumber, message: "Email must be a valid address." }];
  }

  return [
    {
      ok: true,
      row: {
        supplierName,
        contactPerson: cleanSpreadsheetText(mapped.contactPerson),
        contactNumber: cleanSpreadsheetText(mapped.contactNumber),
        email,
        address: cleanSpreadsheetText(mapped.address),
        paymentTerms: cleanSpreadsheetText(mapped.paymentTerms),
        notes: cleanSpreadsheetText(mapped.notes),
        status,
      },
    },
  ];
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
