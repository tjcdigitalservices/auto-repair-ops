import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { DEFAULT_BRAND_PACK, parseStoreHours } from "@/lib/branding/types";
import type { BookingCalendarHoliday, BookingStoreHoursDay } from "@/features/bookings/types";
import type { TableRow } from "@/types/database";

type BranchHolidayRow = Pick<
  TableRow<"branch_holidays">,
  "holiday_date" | "label" | "holiday_kind"
>;

export async function getBookingsCalendarContext(monthStartDate: string, monthEndDate: string) {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("bookings:read");

  const [{ data: brandingData, error: brandingError }, { data: holidayRows, error: holidayError }] =
    await Promise.all([
      supabase
        .from("tenant_branding")
        .select("store_hours")
        .eq("tenant_id", context.tenantId)
        .maybeSingle(),
      (() => {
        let query = supabase
          .from("branch_holidays")
          .select("holiday_date, label, holiday_kind")
          .gte("holiday_date", monthStartDate)
          .lte("holiday_date", monthEndDate)
          .order("holiday_date", { ascending: true });

        return applyBranchFilter(query, branchScope.selectedBranchId);
      })(),
    ]);

  if (brandingError) {
    throw new Error(brandingError.message);
  }

  if (holidayError) {
    throw new Error(holidayError.message);
  }

  const storeHours: BookingStoreHoursDay[] = parseStoreHours(brandingData?.store_hours).map((entry) => ({
    day: entry.day,
    hours: entry.hours,
  }));

  const holidays: BookingCalendarHoliday[] = ((holidayRows ?? []) as BranchHolidayRow[]).map((row) => ({
    holidayDate: row.holiday_date,
    label: row.label,
    holidayKind: row.holiday_kind,
  }));

  return {
    storeHours: storeHours.length > 0 ? storeHours : [...DEFAULT_BRAND_PACK.storeHours],
    holidays,
  };
}
