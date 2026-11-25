"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import { BRANCH_DOCUMENT_SEQUENCE_DEFAULTS } from "@/features/settings/document-sequence-defaults";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_TENANT_UNITS } from "@/lib/tenants/default-units";

const createTenantSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(2).max(120),
  ownerEmail: z.string().trim().email().optional().or(z.literal("")),
  ownerPassword: z.string().min(8).optional().or(z.literal("")),
  ownerFirstName: z.string().trim().min(1).max(80).optional().or(z.literal("")),
  ownerLastName: z.string().trim().min(1).max(80).optional().or(z.literal("")),
});

const updateTenantStatusSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(["trial", "active", "past_due", "suspended", "canceled"]),
});

const updateTenantDetailsSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  currencyCode: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code."),
  timezone: z.string().trim().min(3).max(64),
});

export async function createTenantAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  await requirePlatformAdmin();

  const parsed = createTenantSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    ownerEmail: formData.get("ownerEmail") || "",
    ownerPassword: formData.get("ownerPassword") || "",
    ownerFirstName: formData.get("ownerFirstName") || "Owner",
    ownerLastName: formData.get("ownerLastName") || "Account",
  });

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  if (
    (parsed.data.ownerEmail && !parsed.data.ownerPassword) ||
    (!parsed.data.ownerEmail && parsed.data.ownerPassword)
  ) {
    return {
      status: "error",
      message: "Provide both owner email and password, or leave both blank.",
    };
  }

  const admin = getSupabaseAdminClient();
  let ownerUserId: string | null = null;

  if (parsed.data.ownerEmail && parsed.data.ownerPassword) {
    const { data: createdUser, error: createUserError } =
      await admin.auth.admin.createUser({
        email: parsed.data.ownerEmail,
        password: parsed.data.ownerPassword,
        email_confirm: true,
      });

    if (createUserError) {
      return { status: "error", message: createUserError.message };
    }

    ownerUserId = createdUser.user?.id ?? null;
  }

  const provisioned = await provisionTenantWithServiceRole({
    slug: parsed.data.slug,
    name: parsed.data.name,
    ownerUserId,
    ownerFirstName: parsed.data.ownerFirstName || "Owner",
    ownerLastName: parsed.data.ownerLastName || "Account",
  });

  if (!provisioned.ok) {
    return { status: "error", message: provisioned.message };
  }

  revalidatePath("/platform");
  redirect(`/platform/tenants/${provisioned.tenantId}`);
}

async function provisionTenantWithServiceRole(params: {
  slug: string;
  name: string;
  ownerUserId: string | null;
  ownerFirstName: string;
  ownerLastName: string;
}): Promise<{ ok: true; tenantId: string } | { ok: false; message: string }> {
  const admin = getSupabaseAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      slug: params.slug,
      name: params.name,
      status: "trial",
      plan_key: "starter",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    return { ok: false, message: tenantError?.message ?? "Failed to create tenant." };
  }

  const { error: brandingError } = await admin.from("tenant_branding").insert({
    tenant_id: tenant.id,
    app_name: params.name,
    company_name: params.name,
    meta_title: params.name,
    meta_description: `${params.name} workshop operations.`,
    tagline: "Precision service for every vehicle.",
    receipt_footer_default: "Thank you for your business.",
  });

  if (brandingError) {
    return { ok: false, message: brandingError.message };
  }

  const { error: unitsError } = await admin.rpc("seed_default_units_for_tenant", {
    p_tenant_id: tenant.id,
  });

  if (unitsError) {
    // Fallback for environments that have not applied migration 0058 yet.
    for (const unit of DEFAULT_TENANT_UNITS) {
      const { error } = await admin.from("units").insert({
        tenant_id: tenant.id,
        name: unit.name,
        abbreviation: unit.abbreviation,
      });
      if (error && error.code !== "23505") {
        return { ok: false, message: error.message };
      }
    }
  }

  const { error: vehicleLookupsError } = await admin.rpc(
    "seed_default_vehicle_lookups_for_tenant",
    { p_tenant_id: tenant.id },
  );

  if (vehicleLookupsError) {
    return {
      ok: false,
      message: vehicleLookupsError.message,
    };
  }

  const { data: branch, error: branchError } = await admin
    .from("branches")
    .insert({
      tenant_id: tenant.id,
      code: "MAIN",
      name: "Main Branch",
      is_main: true,
      is_active: true,
      is_default: true,
      status: "active",
    })
    .select("id")
    .single();

  if (branchError || !branch) {
    return { ok: false, message: branchError?.message ?? "Failed to create branch." };
  }

  const { error: sequencesError } = await admin.from("document_sequences").upsert(
    BRANCH_DOCUMENT_SEQUENCE_DEFAULTS.map((sequence) => ({
      key: sequence.key,
      branch_id: branch.id,
      prefix: sequence.prefix,
      padding: sequence.padding,
      last_value: sequence.last_value,
    })),
    { onConflict: "key,branch_id", ignoreDuplicates: true },
  );

  if (sequencesError) {
    return { ok: false, message: sequencesError.message };
  }

  const { error: settingsError } = await admin.from("business_settings").upsert({
    branch_id: branch.id,
    business_name: params.name,
    receipt_footer: "Thank you for your business.",
    default_tax_rate: 0.12,
  });

  if (settingsError) {
    return { ok: false, message: settingsError.message };
  }

  if (params.ownerUserId) {
    const { error: staffError } = await admin.from("staff").insert({
      tenant_id: tenant.id,
      branch_id: branch.id,
      linked_user_id: params.ownerUserId,
      first_name: params.ownerFirstName,
      last_name: params.ownerLastName,
      role: "owner",
      status: "active",
    });

    if (staffError) {
      return { ok: false, message: staffError.message };
    }
  }

  return { ok: true, tenantId: tenant.id };
}

export async function updateTenantStatusAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const platformAdmin = await requirePlatformAdmin();

  const parsed = updateTenantStatusSchema.safeParse({
    tenantId: formData.get("tenantId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const admin = getSupabaseAdminClient();
  const { data: before } = await admin
    .from("tenants")
    .select("status")
    .eq("id", parsed.data.tenantId)
    .maybeSingle();

  const { error } = await admin
    .from("tenants")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.tenantId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(admin, {
    action: "tenant_status_updated",
    entityType: "tenant",
    entityId: parsed.data.tenantId,
    userId: platformAdmin.userId,
    beforeData: before ? { status: before.status } : null,
    afterData: { status: parsed.data.status },
  });

  revalidatePath("/platform");
  revalidatePath(`/platform/tenants/${parsed.data.tenantId}`);
  return { status: "success", message: "Tenant status updated." };
}

export async function updateTenantDetailsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const platformAdmin = await requirePlatformAdmin();

  const parsed = updateTenantDetailsSchema.safeParse({
    tenantId: formData.get("tenantId"),
    name: formData.get("name"),
    currencyCode: formData.get("currencyCode"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const admin = getSupabaseAdminClient();
  const { data: before } = await admin
    .from("tenants")
    .select("name, currency_code, timezone")
    .eq("id", parsed.data.tenantId)
    .maybeSingle();

  const after = {
    name: parsed.data.name,
    currency_code: parsed.data.currencyCode.toUpperCase(),
    timezone: parsed.data.timezone,
  };

  const { error } = await admin
    .from("tenants")
    .update(after)
    .eq("id", parsed.data.tenantId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(admin, {
    action: "tenant_details_updated",
    entityType: "tenant",
    entityId: parsed.data.tenantId,
    userId: platformAdmin.userId,
    beforeData: before,
    afterData: after,
  });

  revalidatePath("/platform");
  revalidatePath(`/platform/tenants/${parsed.data.tenantId}`);
  return { status: "success", message: "Tenant details updated." };
}
