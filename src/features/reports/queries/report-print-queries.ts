import { cache } from "react";
import { DateTime } from "luxon";

import { getBranchScopedServerClient } from "@/lib/branches";
import { buildPrintBusinessProfile } from "@/lib/branding/print-business-profile";
import { getReportsPageData } from "@/features/reports/queries/report-queries";
import type { ReportsPrintDocument } from "@/features/reports/types";

export const getReportsPrintDocument = cache(
  async (input: {
    preset?: string;
    from?: string;
    to?: string;
    groupBy?: string;
  }): Promise<ReportsPrintDocument> => {
    const reports = await getReportsPageData(input);
    const { branchScope, context, supabase } = await getBranchScopedServerClient("reports:read");
    const [{ data: settingsRow, error }, { data: tenantBranding, error: brandingError }] =
      await Promise.all([
        supabase
          .from("business_settings")
          .select("business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at")
          .eq("branch_id", branchScope.writeBranchId)
          .maybeSingle(),
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
      reports,
      businessProfile: buildPrintBusinessProfile(settingsRow, tenantBranding),
      generatedAt: DateTime.now().setZone("Asia/Manila").toISO() ?? new Date().toISOString(),
    };
  },
);
