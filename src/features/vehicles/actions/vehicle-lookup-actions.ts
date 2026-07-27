"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import {
  parseVehicleLookupOptionFormData,
  parseVehicleMakeFormData,
  parseVehicleModelFormData,
  vehicleLookupOptionFormSchema,
  vehicleMakeFormSchema,
  vehicleModelFormSchema,
} from "@/features/vehicles/schemas/vehicle-lookup-schemas";
import type { VehicleLookupType, VehicleStatus } from "@/features/vehicles/types";

const LOOKUPS_PATH = "/settings/vehicle-lookups";

export async function createVehicleMakeAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = vehicleMakeFormSchema.safeParse(parseVehicleMakeFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const trimmedName = parsed.data.name.trim();
  const nameKey = toLookupKey(trimmedName);

  const { data: existingMakeByNameKey, error: existingMakeByNameKeyError } = await supabase
    .from("vehicle_makes")
    .select("id")
    .eq("tenant_id", context.tenantId)
    .eq("name_key", nameKey)
    .maybeSingle();

  if (existingMakeByNameKeyError) {
    return { status: "error", message: existingMakeByNameKeyError.message };
  }

  if (existingMakeByNameKey) {
    return { status: "error", message: "This vehicle make already exists." };
  }

  // Fallback for historical duplicates where name_key normalization may differ.
  const { data: existingMakeByName, error: existingMakeByNameError } = await supabase
    .from("vehicle_makes")
    .select("id")
    .eq("tenant_id", context.tenantId)
    .ilike("name", trimmedName)
    .maybeSingle();

  if (existingMakeByNameError) {
    return { status: "error", message: existingMakeByNameError.message };
  }

  if (existingMakeByName) {
    return { status: "error", message: "This vehicle make already exists." };
  }

  const payload = {
    tenant_id: context.tenantId,
    name: trimmedName,
    name_key: nameKey,
    sort_order: parsed.data.sortOrder ? Number(parsed.data.sortOrder) : 0,
    status: "active" as const,
  };

  const { data, error } = await supabase.from("vehicle_makes").insert(payload).select("*").single();

  if (error) {
    return { status: "error", message: toDuplicateMessage(error.message, "vehicle make") };
  }

  await writeAuditLog(supabase, {
    action: `Created vehicle make: ${payload.name}`,
    entityType: "vehicle_make",
    entityId: data.id,
    userId: context.userId,
    afterData: payload,
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

export async function createVehicleModelAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = vehicleModelFormSchema.safeParse(parseVehicleModelFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const trimmedModelName = parsed.data.name.trim();
  const nameKey = toLookupKey(trimmedModelName);
  const selectedMakeId = parsed.data.makeId;

  // Uniqueness should be based on tenant + (make display name) + (model display name),
  // not just make_id/name_key, since historical imports may have produced duplicate make rows.
  const { data: selectedMake, error: selectedMakeError } = await supabase
    .from("vehicle_makes")
    .select("id,name")
    .eq("id", selectedMakeId)
    .maybeSingle();

  if (selectedMakeError) {
    return { status: "error", message: selectedMakeError.message };
  }

  if (!selectedMake) {
    return { status: "error", message: "Selected make not found." };
  }

  const trimmedMakeName = String(selectedMake.name ?? "").trim();

  const { data: makeIds, error: makeIdsError } = await supabase
    .from("vehicle_makes")
    .select("id")
    .eq("tenant_id", context.tenantId)
    .ilike("name", trimmedMakeName);

  if (makeIdsError) {
    return { status: "error", message: makeIdsError.message };
  }

  const makeIdList = (makeIds ?? []).map((m) => m.id).filter(Boolean);

  if (makeIdList.length > 0) {
    const { data: existingByNameKey, error: existingByNameKeyError } = await supabase
      .from("vehicle_models")
      .select("id")
      .in("make_id", makeIdList)
      .eq("name_key", nameKey)
      .limit(1);

    if (existingByNameKeyError) {
      return { status: "error", message: existingByNameKeyError.message };
    }

    if (existingByNameKey && existingByNameKey.length > 0) {
      return { status: "error", message: "This vehicle model already exists for the selected make." };
    }

    const { data: existingByName, error: existingByNameError } = await supabase
      .from("vehicle_models")
      .select("id")
      .in("make_id", makeIdList)
      .ilike("name", trimmedModelName)
      .limit(1);

    if (existingByNameError) {
      return { status: "error", message: existingByNameError.message };
    }

    if (existingByName && existingByName.length > 0) {
      return { status: "error", message: "This vehicle model already exists for the selected make." };
    }
  }

  const payload = {
    make_id: parsed.data.makeId,
    name: trimmedModelName,
    name_key: nameKey,
    sort_order: parsed.data.sortOrder ? Number(parsed.data.sortOrder) : 0,
    status: "active" as const,
  };

  const { data, error } = await supabase.from("vehicle_models").insert(payload).select("*").single();

  if (error) {
    return { status: "error", message: toDuplicateMessage(error.message, "vehicle model") };
  }

  await writeAuditLog(supabase, {
    action: `Created vehicle model: ${payload.name}`,
    entityType: "vehicle_model",
    entityId: data.id,
    userId: context.userId,
    afterData: payload,
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

export async function createVehicleLookupOptionAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = vehicleLookupOptionFormSchema.safeParse(parseVehicleLookupOptionFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const payload = {
    lookup_type: parsed.data.lookupType,
    label: parsed.data.label.trim(),
    value_key: toLookupKey(parsed.data.label),
    sort_order: parsed.data.sortOrder ? Number(parsed.data.sortOrder) : 0,
    status: "active" as const,
  };

  const { data, error } = await supabase
    .from("vehicle_lookup_options")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return { status: "error", message: toDuplicateMessage(error.message, "lookup option") };
  }

  await writeAuditLog(supabase, {
    action: `Created vehicle lookup option: ${payload.label}`,
    entityType: "vehicle_lookup_option",
    entityId: data.id,
    userId: context.userId,
    afterData: payload,
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

export async function updateVehicleMakeStatusAction(formData: FormData) {
  await updateRecordStatus({
    formData,
    table: "vehicle_makes",
    entityType: "vehicle_make",
    idField: "makeId",
  });
}

export async function updateVehicleModelStatusAction(formData: FormData) {
  await updateRecordStatus({
    formData,
    table: "vehicle_models",
    entityType: "vehicle_model",
    idField: "modelId",
  });
}

export async function updateVehicleLookupOptionStatusAction(formData: FormData) {
  await updateRecordStatus({
    formData,
    table: "vehicle_lookup_options",
    entityType: "vehicle_lookup_option",
    idField: "optionId",
  });
}

export async function deleteVehicleMakeAction(formData: FormData) {
  const makeId = readString(formData, "makeId");

  if (!makeId) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent("Invalid make request.")}`);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const { data: make, error: makeError } = await supabase
    .from("vehicle_makes")
    .select("*")
    .eq("id", makeId)
    .eq("tenant_id", context.tenantId)
    .maybeSingle();

  if (makeError) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent(makeError.message)}`);
  }

  if (!make) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent("Vehicle make not found.")}`);
  }

  const { error: modelsError } = await supabase.from("vehicle_models").delete().eq("make_id", makeId);

  if (modelsError) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent(modelsError.message)}`);
  }

  const { error: deleteError } = await supabase
    .from("vehicle_makes")
    .delete()
    .eq("id", makeId)
    .eq("tenant_id", context.tenantId);

  if (deleteError) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent(deleteError.message)}`);
  }

  await writeAuditLog(supabase, {
    action: `Deleted vehicle make: ${make.name}`,
    entityType: "vehicle_make",
    entityId: makeId,
    userId: context.userId,
    beforeData: make,
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

export async function deleteVehicleModelAction(formData: FormData) {
  const modelId = readString(formData, "modelId");

  if (!modelId) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent("Invalid model request.")}`);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const { data: model, error: modelError } = await supabase
    .from("vehicle_models")
    .select("*, vehicle_makes!inner(tenant_id, name)")
    .eq("id", modelId)
    .eq("vehicle_makes.tenant_id", context.tenantId)
    .maybeSingle();

  if (modelError) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent(modelError.message)}`);
  }

  if (!model) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent("Vehicle model not found.")}`);
  }

  const { error: deleteError } = await supabase.from("vehicle_models").delete().eq("id", modelId);

  if (deleteError) {
    redirect(`${LOOKUPS_PATH}?error=${encodeURIComponent(deleteError.message)}`);
  }

  await writeAuditLog(supabase, {
    action: `Deleted vehicle model: ${model.name}`,
    entityType: "vehicle_model",
    entityId: modelId,
    userId: context.userId,
    beforeData: model,
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

async function updateRecordStatus({
  formData,
  table,
  entityType,
  idField,
}: {
  formData: FormData;
  table: "vehicle_makes" | "vehicle_models" | "vehicle_lookup_options";
  entityType: string;
  idField: string;
}) {
  const id = readString(formData, idField);
  const nextStatus = readString(formData, "status") as VehicleStatus;

  if (!id || !nextStatus) {
    redirect(LOOKUPS_PATH);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const { data: current, error: currentError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (currentError) {
    redirect(LOOKUPS_PATH);
  }

  const { error } = await supabase.from(table).update({ status: nextStatus }).eq("id", id);

  if (error) {
    redirect(LOOKUPS_PATH);
  }

  await writeAuditLog(supabase, {
    action: `Updated ${entityType} status`,
    entityType,
    entityId: id,
    userId: context.userId,
    beforeData: current,
    afterData: { ...current, status: nextStatus },
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

function revalidateVehicleLookupPaths() {
  revalidatePath("/settings");
  revalidatePath(LOOKUPS_PATH);
  revalidatePath("/vehicles");
  revalidatePath("/vehicles/new");
}

function toLookupKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDuplicateMessage(message: string, label: string) {
  if (message.includes("duplicate key") || message.includes("unique constraint")) {
    return `This ${label} already exists.`;
  }

  return message;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
