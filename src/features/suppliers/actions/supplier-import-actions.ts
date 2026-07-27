"use server";

import { revalidatePath } from "next/cache";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import {
  INITIAL_SPREADSHEET_IMPORT_ACTION_STATE,
  type SpreadsheetImportActionState,
} from "@/lib/spreadsheet/spreadsheet-import-state";
import { validateSpreadsheetUpload } from "@/lib/spreadsheet/spreadsheet-io";
import { parseSupplierImportWorkbook } from "@/features/suppliers/import/parse-supplier-import";

export async function importSuppliersFromFileAction(
  _prevState: SpreadsheetImportActionState = INITIAL_SPREADSHEET_IMPORT_ACTION_STATE,
  formData: FormData,
): Promise<SpreadsheetImportActionState> {
  const validated = validateSpreadsheetUpload(formData.get("file"));

  if (!validated.ok) {
    return { status: "error", message: validated.message };
  }

  let parsed;
  try {
    parsed = parseSupplierImportWorkbook(await validated.file.arrayBuffer());
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to read the spreadsheet.",
    };
  }

  if (parsed.validRows.length === 0) {
    return {
      status: "error",
      message:
        parsed.invalidRows[0]?.message ??
        "No valid supplier rows found. Download the template and try again.",
      skippedInvalid: parsed.invalidRows.length,
      errorSamples: parsed.invalidRows.slice(0, 8),
    };
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("suppliers:write");

  const { data: existingRows, error: existingError } = await supabase
    .from("suppliers")
    .select("id, supplier_name")
    .eq("tenant_id", context.tenantId);

  if (existingError) {
    return { status: "error", message: existingError.message };
  }

  const existingByName = new Map(
    (existingRows ?? []).map((row) => [normalizeKey(row.supplier_name), row.id]),
  );

  let created = 0;
  let updated = 0;

  for (const row of parsed.validRows) {
    const payload = {
      tenant_id: context.tenantId,
      supplier_name: row.supplierName,
      contact_person: row.contactPerson || null,
      contact_number: row.contactNumber || null,
      email: row.email || null,
      address: row.address || null,
      payment_terms: row.paymentTerms || null,
      notes: row.notes || null,
      status: row.status,
    };

    const existingId = existingByName.get(normalizeKey(row.supplierName));

    if (existingId) {
      const { error } = await supabase
        .from("suppliers")
        .update(payload)
        .eq("id", existingId)
        .eq("tenant_id", context.tenantId);

      if (error) {
        return { status: "error", message: error.message };
      }

      updated += 1;
    } else {
      const { data, error } = await supabase
        .from("suppliers")
        .insert(payload)
        .select("id, supplier_name")
        .single();

      if (error) {
        return { status: "error", message: error.message };
      }

      existingByName.set(normalizeKey(data.supplier_name), data.id);
      created += 1;
    }
  }

  revalidatePath("/suppliers");
  revalidatePath("/products");

  return {
    status: "success",
    message: `Imported ${created} new and updated ${updated} existing supplier${created + updated === 1 ? "" : "s"}.`,
    created,
    updated,
    skippedInvalid: parsed.invalidRows.length,
    errorSamples: parsed.invalidRows.slice(0, 8),
  };
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}
