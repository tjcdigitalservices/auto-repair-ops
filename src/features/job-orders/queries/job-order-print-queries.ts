import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { buildPreparedByProfile } from "@/lib/auth/prepared-by";
import { buildPrintBusinessProfile } from "@/lib/branding/print-business-profile";
import { getJobOrderById } from "@/features/job-orders/queries/job-order-queries";
import type { JobOrderPrintDocument } from "@/features/job-orders/types";
import type { TableRow } from "@/types/database";

type JobOrderPrintSupportRow = Pick<
  TableRow<"job_orders">,
  "branch_id" | "customer_id" | "vehicle_id"
>;

export const getJobOrderPrintDocument = cache(
  async (jobOrderId: string): Promise<JobOrderPrintDocument | null> => {
    const jobOrder = await getJobOrderById(jobOrderId);

    if (!jobOrder) {
      return null;
    }

    const { supabase, context } = await getAuthorizedSupabaseServerClient("job_orders:read");
    const preparedBy = buildPreparedByProfile(context);
    const { data: supportRow, error: supportError } = await supabase
      .from("job_orders")
      .select("branch_id, customer_id, vehicle_id")
      .eq("id", jobOrderId)
      .maybeSingle();

    if (supportError) {
      throw new Error(supportError.message);
    }

    if (!supportRow) {
      return null;
    }

    const support = supportRow as JobOrderPrintSupportRow;
    const [
      { data: customer, error: customerError },
      { data: vehicle, error: vehicleError },
      { data: businessSettings, error: settingsError },
      { data: tenantBranding, error: brandingError },
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("display_name, contact_number, address")
        .eq("id", support.customer_id)
        .maybeSingle(),
      supabase
        .from("vehicles")
        .select("make, model, year, plate_number, vin")
        .eq("id", support.vehicle_id)
        .maybeSingle(),
      supabase
        .from("business_settings")
        .select("business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at")
        .eq("branch_id", support.branch_id)
        .maybeSingle(),
      supabase
        .from("tenant_branding")
        .select("website_url, facebook_label")
        .eq("tenant_id", context.tenantId)
        .maybeSingle(),
    ]);

    if (customerError) {
      throw new Error(customerError.message);
    }

    if (vehicleError) {
      throw new Error(vehicleError.message);
    }

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    if (brandingError) {
      throw new Error(brandingError.message);
    }

    return {
      jobOrder: {
        ...jobOrder,
        customerContactNumber: customer?.contact_number ?? null,
        customerAddress: customer?.address ?? null,
        vehicleMake: vehicle?.make ?? null,
        vehicleModel: vehicle?.model ?? null,
        vehicleYear: vehicle?.year ?? null,
        vehiclePlateNumber: vehicle?.plate_number ?? null,
        vehicleVin: vehicle?.vin ?? null,
        preparedByName: preparedBy.name,
        preparedByTitle: preparedBy.title,
      },
      businessProfile: buildPrintBusinessProfile(businessSettings, tenantBranding),
    };
  },
);
