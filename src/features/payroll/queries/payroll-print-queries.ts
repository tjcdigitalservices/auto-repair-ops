import { cache } from "react";
import { DateTime } from "luxon";

import { getBranchScopedServerClient } from "@/lib/branches";
import { buildPrintBusinessProfile } from "@/lib/branding/print-business-profile";
import { getPayrollPeriodDetailData } from "@/features/payroll/queries/payroll-queries";
import type { PayrollPrintDocument, PayslipPrintDocument } from "@/features/payroll/types";

export const getPayrollPrintDocument = cache(
  async (periodId: string): Promise<PayrollPrintDocument | null> => {
    const detail = await getPayrollPeriodDetailData(periodId);

    if (!detail.period.generatedAt || detail.items.length === 0) {
      return null;
    }

    const { context, supabase } = await getBranchScopedServerClient("payroll:read");
    const [{ data: settingsRow, error }, { data: tenantBranding, error: brandingError }] =
      await Promise.all([
        supabase
          .from("business_settings")
          .select(
            "business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at",
          )
          .eq("branch_id", detail.period.branchId)
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
      ...detail,
      businessProfile: buildPrintBusinessProfile(settingsRow, tenantBranding),
      generatedAt:
        detail.period.generatedAt ??
        DateTime.now().setZone("Asia/Manila").toISO() ??
        new Date().toISOString(),
    };
  },
);

export const getPayslipPrintDocument = cache(
  async (
    periodId: string,
    payrollPeriodItemId: string,
  ): Promise<PayslipPrintDocument | null> => {
    const detail = await getPayrollPeriodDetailData(periodId);
    const item = detail.items.find((candidate) => candidate.id === payrollPeriodItemId);

    if (!detail.period.generatedAt || !item) {
      return null;
    }

    const { context, supabase } = await getBranchScopedServerClient("payroll:read");
    const [{ data: settingsRow, error }, { data: tenantBranding, error: brandingError }] =
      await Promise.all([
        supabase
          .from("business_settings")
          .select(
            "business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at",
          )
          .eq("branch_id", detail.period.branchId)
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
      period: detail.period,
      settings: detail.settings,
      item,
      businessProfile: buildPrintBusinessProfile(settingsRow, tenantBranding),
      generatedAt:
        detail.period.generatedAt ??
        DateTime.now().setZone("Asia/Manila").toISO() ??
        new Date().toISOString(),
    };
  },
);
