import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { buildPrintBusinessProfile } from "@/lib/branding/print-business-profile";
import { getPaymentById } from "@/features/invoices/queries/invoice-queries";
import type { PaymentPrintDocument } from "@/features/invoices/types";

export const getPaymentPrintDocument = cache(
  async (paymentId: string): Promise<PaymentPrintDocument | null> => {
    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return null;
    }

    const { supabase, context } = await getAuthorizedSupabaseServerClient("payments:read");
    const [{ data: businessSettings, error }, { data: tenantBranding, error: brandingError }] =
      await Promise.all([
        payment.branchId
          ? supabase
              .from("business_settings")
              .select("business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at")
              .eq("branch_id", payment.branchId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("tenant_branding")
          .select("website_url, facebook_label")
          .eq("tenant_id", context.tenantId)
          .maybeSingle(),
      ]);

    if (error) {
      throw new Error(error.message);
    }

    if (brandingError) {
      throw new Error(brandingError.message);
    }

    return {
      payment,
      businessProfile: buildPrintBusinessProfile(businessSettings, tenantBranding),
    };
  },
);
