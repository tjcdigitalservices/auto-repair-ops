"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import { TENANT_SLUG_COOKIE } from "@/lib/branding";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseSignInFormData,
  signInSchema,
} from "@/features/auth/schemas/sign-in-schema";
import { isTenantOperable } from "@/lib/tenants/status";

export async function signInAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = signInSchema.safeParse(parseSignInFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const signedInUserId = data.user?.id;

  if (!signedInUserId) {
    redirect("/dashboard");
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", signedInUserId)
    .maybeSingle();

  if (platformAdmin) {
    redirect("/platform");
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("role, tenant_id, status")
    .eq("linked_user_id", signedInUserId)
    .maybeSingle();

  if (staffError) {
    return {
      status: "error",
      message: staffError.message,
    };
  }

  if (!staff || staff.status !== "active") {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This account is not set up for active staff access.",
    };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug, status")
    .eq("id", staff.tenant_id)
    .maybeSingle();

  if (!tenant || !isTenantOperable(tenant.status)) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This shop subscription is suspended or inactive.",
    };
  }

  if (tenant.slug) {
    const cookieStore = await cookies();
    cookieStore.set(TENANT_SLUG_COOKIE, tenant.slug, {
      path: "/",
      sameSite: "lax",
    });
  }

  redirect(staff.role === "mechanic" ? "/portal/attendance" : "/dashboard");
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
