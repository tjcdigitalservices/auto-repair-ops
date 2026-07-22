"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { getBranchScope } from "@/lib/branches";
import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SELECTED_BRANCH_COOKIE } from "@/lib/tenants";
import { cookies } from "next/headers";

const createBranchSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[A-Z0-9_-]+$/, "Use uppercase letters, numbers, hyphens, or underscores."),
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().optional().or(z.literal("")),
  contactNumber: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export async function createBranchAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const context = await requireAuthenticatedStaff();

  if (context.role !== "owner") {
    return { status: "error", message: "Only tenant owners can create branches." };
  }

  const parsed = createBranchSchema.safeParse({
    code: String(formData.get("code") ?? "").toUpperCase(),
    name: formData.get("name"),
    address: formData.get("address") || "",
    contactNumber: formData.get("contactNumber") || "",
    email: formData.get("email") || "",
  });

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("branches").insert({
    tenant_id: context.tenantId,
    code: parsed.data.code,
    name: parsed.data.name,
    address: parsed.data.address || null,
    contact_number: parsed.data.contactNumber || null,
    email: parsed.data.email || null,
    is_main: false,
    is_active: true,
    is_default: false,
    status: "active",
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/settings/branches");
  revalidatePath("/settings");
  return { status: "success", message: "Branch created." };
}

export async function selectBranchAction(formData: FormData) {
  const context = await requireAuthenticatedStaff();
  const branchId = String(formData.get("branchId") ?? "");
  const scope = await getBranchScope();

  const allowed =
    scope.accessibleBranches.some((branch) => branch.id === branchId) ||
    (context.role === "owner" &&
      scope.accessibleBranches.some((branch) => branch.id === branchId));

  if (!allowed) {
    throw new Error("You do not have access to that branch.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SELECTED_BRANCH_COOKIE, branchId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/", "layout");
}
