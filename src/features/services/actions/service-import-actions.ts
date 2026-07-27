"use server";

import { revalidatePath } from "next/cache";

import { getBranchScopedServerClient } from "@/lib/branches";
import {
  INITIAL_SPREADSHEET_IMPORT_ACTION_STATE,
  type SpreadsheetImportActionState,
} from "@/lib/spreadsheet/spreadsheet-import-state";
import { validateSpreadsheetUpload } from "@/lib/spreadsheet/spreadsheet-io";
import { parseServiceImportWorkbook } from "@/features/services/import/parse-service-import";

export async function importServicesFromFileAction(
  _prevState: SpreadsheetImportActionState = INITIAL_SPREADSHEET_IMPORT_ACTION_STATE,
  formData: FormData,
): Promise<SpreadsheetImportActionState> {
  const validated = validateSpreadsheetUpload(formData.get("file"));

  if (!validated.ok) {
    return { status: "error", message: validated.message };
  }

  let parsed;
  try {
    parsed = parseServiceImportWorkbook(await validated.file.arrayBuffer());
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
        "No valid service rows found. Download the template and try again.",
      skippedInvalid: parsed.invalidRows.length,
      errorSamples: parsed.invalidRows.slice(0, 8),
    };
  }

  const { branchScope, supabase } = await getBranchScopedServerClient("services:write");
  const branchId = branchScope.writeBranchId;

  const { data: existingRows, error: existingError } = await supabase
    .from("services")
    .select("id, name")
    .eq("branch_id", branchId);

  if (existingError) {
    return { status: "error", message: existingError.message };
  }

  const existingByName = new Map(
    (existingRows ?? []).map((row) => [normalizeKey(row.name), row.id]),
  );

  let created = 0;
  let updated = 0;

  for (const row of parsed.validRows) {
    const payload = {
      branch_id: branchId,
      name: row.name,
      category: row.category || null,
      description: row.description || null,
      labor_price: row.laborPrice,
      estimated_duration_minutes: row.estimatedDurationMinutes,
      status: row.status,
    };

    const existingId = existingByName.get(normalizeKey(row.name));

    if (existingId) {
      const { error } = await supabase.from("services").update(payload).eq("id", existingId);

      if (error) {
        return { status: "error", message: error.message };
      }

      updated += 1;
    } else {
      const { data, error } = await supabase
        .from("services")
        .insert(payload)
        .select("id, name")
        .single();

      if (error) {
        return { status: "error", message: error.message };
      }

      existingByName.set(normalizeKey(data.name), data.id);
      created += 1;
    }
  }

  revalidatePath("/services");
  revalidatePath("/quotations/new");

  return {
    status: "success",
    message: `Imported ${created} new and updated ${updated} existing service${created + updated === 1 ? "" : "s"}.`,
    created,
    updated,
    skippedInvalid: parsed.invalidRows.length,
    errorSamples: parsed.invalidRows.slice(0, 8),
  };
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}
