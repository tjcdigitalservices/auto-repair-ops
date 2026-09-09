"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { toFormActionState } from "@/lib/forms";
import { isMissingStaffDocumentTitleColumnError } from "@/features/staff/document-title-compat";
import { parseStaffFormData, staffFormSchema } from "@/features/staff/schemas/staff-form-schema";
import {
  deleteMechanicPortalLogin,
  linkExistingMechanicPortalLogin,
  migrateMechanicPortalLoginToTenantDomain,
  provisionMechanicPortalLogin,
  resolveMechanicPortalEmailDomain,
} from "@/features/staff/services/mechanic-portal-login";
import {
  INITIAL_STAFF_ACTION_STATE,
  type StaffActionState,
} from "@/features/staff/types";
import type { TableInsert } from "@/types/database";

type StaffSavePayload = Pick<
  TableInsert<"staff">,
  | "tenant_id"
  | "branch_id"
  | "first_name"
  | "last_name"
  | "document_title"
  | "role"
  | "is_payroll_eligible"
  | "contact_number"
  | "address"
  | "sss_number"
  | "philhealth_number"
  | "tin_number"
  | "emergency_contact_name"
  | "emergency_contact_number"
  | "status"
> & {
  linked_user_id?: string | null;
};

type LegacyStaffSavePayload = Omit<StaffSavePayload, "document_title">;

export async function createStaffAction(
  _prevState: StaffActionState = INITIAL_STAFF_ACTION_STATE,
  formData: FormData,
): Promise<StaffActionState> {
  return saveStaff(formData);
}

export async function updateStaffAction(
  _prevState: StaffActionState = INITIAL_STAFF_ACTION_STATE,
  formData: FormData,
): Promise<StaffActionState> {
  return saveStaff(formData);
}

export async function migrateMechanicPortalLoginAction(
  _prevState: StaffActionState = INITIAL_STAFF_ACTION_STATE,
  formData: FormData,
): Promise<StaffActionState> {
  const staffId = readStaffId(formData);

  if (!staffId) {
    return { status: "error", message: "Staff record is required." };
  }

  const { branchScope, supabase } = await getBranchScopedServerClient("staff:write");
  const portalEmailDomain = await resolveMechanicPortalEmailDomain(
    supabase,
    branchScope.tenantId,
  );

  const { data: staff, error: staffError } = await applyBranchFilter(
    supabase
      .from("staff")
      .select("id, first_name, last_name, role, linked_user_id")
      .eq("id", staffId),
    branchScope.selectedBranchId,
  ).maybeSingle();

  if (staffError) {
    return { status: "error", message: staffError.message };
  }

  if (!staff) {
    return { status: "error", message: "Staff record does not exist." };
  }

  if (staff.role !== "mechanic") {
    return { status: "error", message: "Only mechanics can have portal logins." };
  }

  if (!staff.linked_user_id) {
    return { status: "error", message: "This mechanic does not have a linked portal account." };
  }

  try {
    const migrated = await migrateMechanicPortalLoginToTenantDomain({
      linkedUserId: staff.linked_user_id,
      firstName: staff.first_name,
      lastName: staff.last_name,
      emailDomain: portalEmailDomain,
    });

    revalidatePath("/staff");
    revalidatePath(`/staff/${staffId}/edit`);

    return {
      status: "success",
      message: "Portal username updated for this tenant.",
      portalLogin: {
        staffId: staff.id,
        staffName: `${staff.first_name} ${staff.last_name}`.trim(),
        username: migrated.username,
        temporaryPassword: migrated.temporaryPassword,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Portal username could not be updated for this tenant.",
    };
  }
}

async function saveStaff(formData: FormData): Promise<StaffActionState> {
  const parsed = staffFormSchema.safeParse(parseStaffFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("staff:write");
  const portalEmailDomain = await resolveMechanicPortalEmailDomain(
    supabase,
    branchScope.tenantId,
  );
  const branchId = values.staffId
    ? await getExistingStaffBranchId(supabase, branchScope.selectedBranchId, values.staffId)
    : branchScope.writeBranchId;

  let linkedUserId: string | null = null;

  if (values.staffId && values.role === "mechanic" && values.linkPortalUsername.trim()) {
    const existingLinkedUserId = await getExistingLinkedUserId(
      supabase,
      branchScope.selectedBranchId,
      values.staffId,
    );

    if (existingLinkedUserId) {
      return {
        status: "error",
        message: "This mechanic already has a linked portal account.",
        fieldErrors: {
          linkPortalUsername: ["Portal account is already linked."],
        },
      };
    }

    try {
      const linkedLogin = await linkExistingMechanicPortalLogin({
        portalUsername: values.linkPortalUsername,
        staffId: values.staffId,
        emailDomain: portalEmailDomain,
      });
      linkedUserId = linkedLogin.userId;
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Portal account could not be linked.",
        fieldErrors: {
          linkPortalUsername: [
            error instanceof Error ? error.message : "Portal account could not be linked.",
          ],
        },
      };
    }
  }

  const basePayload = {
    tenant_id: branchScope.tenantId,
    branch_id: branchId,
    first_name: values.firstName,
    last_name: values.lastName,
    document_title: normalizeNullable(values.documentTitle),
    role: values.role,
    is_payroll_eligible: values.isPayrollEligible,
    contact_number: normalizeNullable(values.contactNumber),
    address: normalizeNullable(values.address),
    sss_number: normalizeNullable(values.sssNumber),
    philhealth_number: normalizeNullable(values.philhealthNumber),
    tin_number: normalizeNullable(values.tinNumber),
    pagibig_number: normalizeNullable(values.pagibigNumber),
    emergency_contact_name: normalizeNullable(values.emergencyContactName),
    emergency_contact_number: normalizeNullable(values.emergencyContactNumber),
    status: values.status,
  };

  const payload: StaffSavePayload = linkedUserId
    ? { ...basePayload, linked_user_id: linkedUserId }
    : basePayload;

  let saveResult = await executeStaffSaveOperation({
    supabase,
    staffId: values.staffId,
    payload,
  });

  if (saveResult.error && isMissingStaffDocumentTitleColumnError(saveResult.error)) {
    const { document_title: _documentTitle, ...legacyPayload } = payload;
    saveResult = await executeStaffSaveOperation({
      supabase,
      staffId: values.staffId,
      payload: legacyPayload,
    });
  }

  if (saveResult.error || !saveResult.data?.id) {
    return {
      status: "error",
      message: saveResult.error?.message ?? "Staff record could not be saved.",
    };
  }

  const staffId = saveResult.data.id;
  const isCreate = !values.staffId;

  if (isCreate && values.role === "mechanic") {
    let createdLogin: Awaited<ReturnType<typeof provisionMechanicPortalLogin>> | null = null;

    try {
      createdLogin = await provisionMechanicPortalLogin({
        firstName: values.firstName,
        lastName: values.lastName,
        emailDomain: portalEmailDomain,
      });

      const { error: linkError } = await supabase
        .from("staff")
        .update({ linked_user_id: createdLogin.userId })
        .eq("id", staffId);

      if (linkError) {
        throw new Error(linkError.message);
      }
    } catch (error) {
      if (createdLogin?.userId) {
        try {
          await deleteMechanicPortalLogin(createdLogin.userId);
        } catch {
          // Best-effort cleanup only.
        }
      }

      await supabase.from("staff").delete().eq("id", staffId);

      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Mechanic portal login could not be created. The staff record was rolled back.",
      };
    }

    revalidatePath("/staff");

    return {
      status: "success",
      message: "Mechanic staff record created.",
      portalLogin: {
        staffId,
        staffName: `${values.firstName} ${values.lastName}`.trim(),
        username: createdLogin.username,
        temporaryPassword: createdLogin.temporaryPassword,
      },
    };
  }

  revalidatePath("/staff");
  redirect("/staff");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function getExistingStaffBranchId(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  staffId: string,
) {
  const { data, error } = await applyBranchFilter(
    supabase.from("staff").select("branch_id"),
    selectedBranchId,
  )
    .eq("id", staffId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.branch_id) {
    throw new Error("Staff record does not exist.");
  }

  return data.branch_id;
}

async function getExistingLinkedUserId(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  staffId: string,
) {
  const { data, error } = await applyBranchFilter(
    supabase.from("staff").select("linked_user_id"),
    selectedBranchId,
  )
    .eq("id", staffId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.linked_user_id ?? null;
}

async function executeStaffSaveOperation({
  supabase,
  staffId,
  payload,
}: {
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
  staffId?: string;
  payload: StaffSavePayload | LegacyStaffSavePayload;
}) {
  return staffId
    ? supabase.from("staff").update(payload).eq("id", staffId).select("id").single()
    : supabase.from("staff").insert(payload).select("id").single();
}

function readStaffId(formData: FormData) {
  const value = formData.get("staffId");
  return typeof value === "string" && value ? value : null;
}
