import { cache } from "react";
import { DateTime } from "luxon";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { buildPreparedByProfile } from "@/lib/auth/prepared-by";
import { buildPrintBusinessProfile } from "@/lib/branding/print-business-profile";
import { mapQuotationDetail } from "@/features/quotations/mappers";
import { getQuotationById } from "@/features/quotations/queries/quotation-queries";
import type {
  QuotationDetail,
  QuotationPrintBusinessProfile,
  QuotationPrintDocument,
} from "@/features/quotations/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";

type QuotationRow = TableRow<"quotations">;
type QuotationItemRow = TableRow<"quotation_items">;

async function resolveViewerKind(): Promise<"staff" | "customer" | "none"> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "none";

  const { data: staff } = await supabase
    .from("staff")
    .select("id, status")
    .eq("linked_user_id", user.id)
    .maybeSingle();

  if (staff?.status === "active") return "staff";

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("linked_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return customer?.id ? "customer" : "none";
}

async function getCustomerOwnedQuotationById(
  quotationId: string,
): Promise<QuotationDetail | null> {
  const supabase = await getSupabaseServerClient();

  const [
    { data: quotation, error: quotationError },
    { data: items, error: itemsError },
    { data: jobOrder, error: jobOrderError },
  ] = await Promise.all([
    supabase.from("quotations").select("*").eq("id", quotationId).maybeSingle(),
    supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("line_number", { ascending: true }),
    supabase
      .from("job_orders")
      .select("id, job_order_number")
      .eq("quotation_id", quotationId)
      .maybeSingle(),
  ]);

  if (quotationError) throw new Error(quotationError.message);
  if (itemsError) throw new Error(itemsError.message);
  if (jobOrderError) throw new Error(jobOrderError.message);
  if (!quotation) return null;

  const [{ data: customer }, { data: vehicle }] = await Promise.all([
    supabase
      .from("customers")
      .select("display_name")
      .eq("id", quotation.customer_id)
      .maybeSingle(),
    supabase
      .from("vehicles")
      .select("make, model, year")
      .eq("id", quotation.vehicle_id)
      .maybeSingle(),
  ]);

  const vehicleLabel = vehicle
    ? `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ""}`
    : "Vehicle";

  return mapQuotationDetail(
    quotation as QuotationRow,
    customer?.display_name ?? "Customer",
    vehicleLabel,
    (items ?? []) as QuotationItemRow[],
    jobOrder,
  );
}

async function buildPrintDocument(
  quotation: QuotationDetail,
  options: {
    supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
    tenantId: string | null;
    preparedByName: string | null;
    preparedByTitle: string | null;
  },
): Promise<QuotationPrintDocument> {
  const [{ data: businessSettings, error }, { data: tenantBranding, error: brandingError }, { data: customer, error: customerError }, { data: vehicle, error: vehicleError }] =
    await Promise.all([
      options.supabase
        .from("business_settings")
        .select(
          "business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at",
        )
        .eq("branch_id", quotation.branchId)
        .maybeSingle(),
      options.tenantId
        ? options.supabase
            .from("tenant_branding")
            .select("website_url, facebook_label")
            .eq("tenant_id", options.tenantId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      options.supabase
        .from("customers")
        .select("company_name, email")
        .eq("id", quotation.customerId)
        .maybeSingle(),
      options.supabase
        .from("vehicles")
        .select("color, mileage")
        .eq("id", quotation.vehicleId)
        .maybeSingle(),
    ]);

  if (error) throw new Error(error.message);
  if (brandingError) throw new Error(brandingError.message);
  if (customerError) throw new Error(customerError.message);
  if (vehicleError) throw new Error(vehicleError.message);

  const businessProfile: QuotationPrintBusinessProfile = buildPrintBusinessProfile(
    businessSettings,
    tenantBranding,
  );
  const validUntil = DateTime.fromISO(quotation.createdAt, { zone: "utc" })
    .setZone("Asia/Manila")
    .plus({ days: 14 })
    .toISO();

  return {
    quotation: {
      ...quotation,
      preparedByName: options.preparedByName,
      preparedByTitle: options.preparedByTitle,
    },
    businessProfile,
    customerSnapshot: {
      companyName: customer?.company_name ?? null,
      email: customer?.email ?? null,
    },
    vehicleSnapshot: {
      color: vehicle?.color ?? null,
      mileage: vehicle?.mileage ?? null,
    },
    validUntil,
  };
}

export const getQuotationPrintDocument = cache(
  async (quotationId: string): Promise<QuotationPrintDocument | null> => {
    const viewer = await resolveViewerKind();

    if (viewer === "staff") {
      const quotation = await getQuotationById(quotationId);
      if (!quotation) return null;

      const { supabase, context } = await getAuthorizedSupabaseServerClient("quotations:read");
      const preparedBy = buildPreparedByProfile(context);

      return buildPrintDocument(quotation, {
        supabase,
        tenantId: context.tenantId,
        preparedByName: preparedBy.name,
        preparedByTitle: preparedBy.title,
      });
    }

    if (viewer === "customer") {
      const quotation = await getCustomerOwnedQuotationById(quotationId);
      if (!quotation) return null;

      const supabase = await getSupabaseServerClient();
      const { data: tenantId } = await supabase.rpc("current_customer_tenant_id");

      return buildPrintDocument(quotation, {
        supabase,
        tenantId: typeof tenantId === "string" ? tenantId : null,
        preparedByName: quotation.preparedByName,
        preparedByTitle: quotation.preparedByTitle,
      });
    }

    return null;
  },
);
