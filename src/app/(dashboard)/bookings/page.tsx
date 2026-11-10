import { buildBookingsCalendarData } from "@/features/bookings/bookings-calendar-utils";
import { BookingsPageView } from "@/features/bookings/components/bookings-page-view";
import { getBookingsCalendarContext } from "@/features/bookings/queries/booking-calendar-queries";
import { listBookings } from "@/features/bookings/queries/booking-queries";
import type { BookingStatus } from "@/features/bookings/types";
import { DEFAULT_BRAND_PACK } from "@/lib/branding/types";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

type BookingsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: BookingStatus;
    page?: string;
    view?: "calendar" | "list";
    month?: string;
    date?: string;
  }>;
};

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const [{ search = "", status = "", page, month, date }, branchSelector] = await Promise.all([
    searchParams,
    getBranchScope().then(getPageBranchSelectorProps),
  ]);

  const calendarShell = buildBookingsCalendarData({
    bookings: [],
    storeHours: [...DEFAULT_BRAND_PACK.storeHours],
    holidays: [],
    month,
    selectedDate: date,
  });

  const listResult = await listBookings({ search, status });
  const calendarBookingsResult = listResult.migrationHint
    ? listResult
    : await listBookings({
        rangeStart: calendarShell.monthStartDate,
        rangeEnd: calendarShell.monthEndDate,
      });

  const calendarContext = listResult.migrationHint
    ? { storeHours: [...DEFAULT_BRAND_PACK.storeHours], holidays: [] as const }
  : await getBookingsCalendarContext(calendarShell.monthStartDate, calendarShell.monthEndDate).catch(
      () => ({
        storeHours: [...DEFAULT_BRAND_PACK.storeHours],
        holidays: [] as const,
      }),
    );

  const calendar = buildBookingsCalendarData({
    bookings: calendarBookingsResult.bookings,
    storeHours: [...calendarContext.storeHours],
    holidays: [...calendarContext.holidays],
    month,
    selectedDate: date,
  });

  const branch = branchSelector.branches.find((item) => item.id === branchSelector.selectedBranchId) ?? branchSelector.branches[0];

  const sharedProps = {
    bookings: listResult.bookings,
    calendarBookings: calendarBookingsResult.bookings,
    calendar,
    search,
    status: status as "" | BookingStatus,
    page,
    migrationHint: listResult.migrationHint,
  };

  if (!branch) {
    return (
      <BookingsPageView
        {...sharedProps}
        branch={{ id: "", name: "Workshop", code: "MAIN" }}
      />
    );
  }

  return <BookingsPageView {...sharedProps} branch={branch} />;
}
