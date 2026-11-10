import { DateTime } from "luxon";

import type {
  BookingCalendarDaySummary,
  BookingCalendarHoliday,
  BookingListItem,
  BookingStoreHoursDay,
  BookingsCalendarData,
} from "@/features/bookings/types";
import { getBusinessNow } from "@/lib/dates";

const ACTIVE_BOOKING_STATUSES = new Set<BookingListItem["status"]>([
  "requested",
  "confirmed",
  "checked_in",
]);

const UPCOMING_BOOKING_STATUSES = new Set<BookingListItem["status"]>(["requested", "confirmed"]);

export function buildBookingsCalendarData({
  bookings,
  storeHours,
  holidays,
  month,
  selectedDate,
  zone = "Asia/Manila",
}: {
  bookings: BookingListItem[];
  storeHours: BookingStoreHoursDay[];
  holidays: BookingCalendarHoliday[];
  month?: string;
  selectedDate?: string;
  zone?: string;
}): BookingsCalendarData {
  const now = getBusinessNow();
  const today = now.toISODate() ?? DateTime.now().setZone(zone).toISODate()!;
  const resolvedMonth = resolveMonthStart(month, selectedDate, today, zone);
  const monthStart = resolvedMonth.startOf("month");
  const monthEnd = monthStart.endOf("month");
  const monthStartDate = monthStart.toISODate()!;
  const monthEndDate = monthEnd.toISODate()!;
  const resolvedSelectedDate = clampDateToMonth(
    selectedDate ?? (monthStartDate <= today && today <= monthEndDate ? today : monthStartDate),
    monthStartDate,
    monthEndDate,
  );

  const holidayByDate = new Map(holidays.map((holiday) => [holiday.holidayDate, holiday] as const));
  const bookingsByDate = groupBookingsByLocalDate(bookings, zone);

  const days: BookingCalendarDaySummary[] = [];
  let cursor = monthStart;

  while (cursor.toISODate()! <= monthEndDate) {
    const date = cursor.toISODate()!;
    const dayBookings = bookingsByDate.get(date) ?? [];
    const holiday = holidayByDate.get(date) ?? null;
    const storeHoursLabel = resolveStoreHoursLabel(date, storeHours, zone);
    const closedReason = resolveClosedReason(date, storeHoursLabel, holiday);

    days.push({
      date,
      bookingCount: dayBookings.filter((item) => ACTIVE_BOOKING_STATUSES.has(item.status)).length,
      activeBookingCount: dayBookings.filter((item) => UPCOMING_BOOKING_STATUSES.has(item.status))
        .length,
      isClosed: closedReason !== null,
      closedReason,
      holiday,
      storeHoursLabel,
      bookings: [...dayBookings].sort(compareBookingsByTime),
    });

    cursor = cursor.plus({ days: 1 });
  }

  const upcoming = bookings
    .filter(
      (item) =>
        UPCOMING_BOOKING_STATUSES.has(item.status) &&
        DateTime.fromISO(item.scheduledStart).setZone(zone) >= now,
    )
    .sort(compareBookingsByTime)
    .slice(0, 8);

  return {
    monthStartDate,
    monthEndDate,
    monthLabel: monthStart.toFormat("LLLL yyyy"),
    selectedDate: resolvedSelectedDate,
    today,
    storeHours,
    days,
    upcoming,
  };
}

export function buildBookingCalendarCells(days: BookingCalendarDaySummary[], monthStartDate: string) {
  const monthStart = DateTime.fromISO(monthStartDate);
  const leadingBlankCount = monthStart.weekday % 7;
  const dayByDate = new Map(days.map((day) => [day.date, day] as const));
  const cells: Array<{ date: string; isCurrentMonth: boolean; day: BookingCalendarDaySummary | null }> =
    [];

  for (let index = 0; index < leadingBlankCount; index += 1) {
    const date = monthStart.minus({ days: leadingBlankCount - index }).toISODate()!;
    cells.push({ date, isCurrentMonth: false, day: dayByDate.get(date) ?? null });
  }

  for (const day of days) {
    cells.push({ date: day.date, isCurrentMonth: true, day });
  }

  const trailingCount = (7 - (cells.length % 7)) % 7;
  const lastDate = days.at(-1)?.date ?? monthStartDate;

  for (let index = 1; index <= trailingCount; index += 1) {
    const date = DateTime.fromISO(lastDate).plus({ days: index }).toISODate()!;
    cells.push({ date, isCurrentMonth: false, day: dayByDate.get(date) ?? null });
  }

  return cells;
}

export function formatBookingTimeRange(
  scheduledStart: string,
  scheduledEnd: string | null,
  zone = "Asia/Manila",
) {
  const start = DateTime.fromISO(scheduledStart).setZone(zone);
  const startLabel = start.toFormat("h:mm a");

  if (!scheduledEnd) {
    return startLabel;
  }

  const end = DateTime.fromISO(scheduledEnd).setZone(zone);
  return `${startLabel} – ${end.toFormat("h:mm a")}`;
}

function resolveMonthStart(month: string | undefined, selectedDate: string | undefined, today: string, zone: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return DateTime.fromISO(`${month}-01`, { zone });
  }

  if (selectedDate) {
    return DateTime.fromISO(selectedDate, { zone }).startOf("month");
  }

  return DateTime.fromISO(today, { zone }).startOf("month");
}

function clampDateToMonth(date: string, monthStartDate: string, monthEndDate: string) {
  if (date < monthStartDate) {
    return monthStartDate;
  }

  if (date > monthEndDate) {
    return monthEndDate;
  }

  return date;
}

function groupBookingsByLocalDate(bookings: BookingListItem[], zone: string) {
  const map = new Map<string, BookingListItem[]>();

  for (const booking of bookings) {
    const date = DateTime.fromISO(booking.scheduledStart).setZone(zone).toISODate();

    if (!date) {
      continue;
    }

    const items = map.get(date) ?? [];
    items.push(booking);
    map.set(date, items);
  }

  return map;
}

function resolveStoreHoursLabel(date: string, storeHours: BookingStoreHoursDay[], zone: string) {
  const dayName = DateTime.fromISO(date, { zone }).toFormat("cccc");
  const entry = storeHours.find((item) => item.day.toLowerCase() === dayName.toLowerCase());
  const hours = entry?.hours?.trim();

  return hours ? hours : null;
}

function resolveClosedReason(
  date: string,
  storeHoursLabel: string | null,
  holiday: BookingCalendarHoliday | null,
): "holiday" | "weekly" | null {
  if (holiday) {
    return "holiday";
  }

  if (!storeHoursLabel) {
    return null;
  }

  const normalized = storeHoursLabel.toLowerCase();

  if (normalized === "closed" || normalized === "close" || normalized === "off") {
    return "weekly";
  }

  return null;
}

function compareBookingsByTime(left: BookingListItem, right: BookingListItem) {
  return left.scheduledStart.localeCompare(right.scheduledStart);
}
