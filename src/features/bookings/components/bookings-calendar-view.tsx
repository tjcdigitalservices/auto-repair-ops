"use client";

import { DateTime } from "luxon";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingRowActions } from "@/features/bookings/components/booking-row-actions";
import {
  buildBookingCalendarCells,
  formatBookingTimeRange,
} from "@/features/bookings/bookings-calendar-utils";
import type { BookingsCalendarData } from "@/features/bookings/types";
import {
  getBookingServiceKindLabel,
  getBookingStatusLabel,
  getBookingStatusTone,
} from "@/features/bookings/utils";
import { stripSandboxBasePath } from "@/features/sandbox/constants";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function BookingsCalendarView({ calendar }: { calendar: BookingsCalendarData }) {
  const pathname = stripSandboxBasePath(usePathname());
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDay =
    calendar.days.find((day) => day.date === calendar.selectedDate) ?? calendar.days[0];
  const calendarCells = buildBookingCalendarCells(calendar.days, calendar.monthStartDate);

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function shiftMonth(offset: number) {
    const nextMonth = DateTime.fromISO(calendar.monthStartDate).plus({ months: offset });
    updateParams({
      month: nextMonth.toFormat("yyyy-MM"),
      date: nextMonth.toISODate(),
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">{calendar.monthLabel}</CardTitle>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => shiftMonth(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tap a day to see schedule, shop hours, and appointments.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1 text-[11px] font-medium uppercase text-muted-foreground">
                {label}
              </div>
            ))}
            {calendarCells.map((cell) => {
              const day = cell.day;
              const isSelected = cell.date === calendar.selectedDate;
              const isToday = cell.date === calendar.today;

              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={!cell.isCurrentMonth}
                  onClick={() => updateParams({ date: cell.date })}
                  className={cn(
                    "mx-auto flex min-h-11 w-full max-w-12 flex-col items-center justify-center rounded-xl px-0.5 py-1 text-xs transition-colors",
                    !cell.isCurrentMonth && "pointer-events-none opacity-30",
                    isSelected && "bg-brand-navy text-white shadow-sm",
                    !isSelected && isToday && "ring-1 ring-brand-navy/40",
                    !isSelected && cell.isCurrentMonth && "hover:bg-muted/60",
                    day?.isClosed && !isSelected && "text-muted-foreground",
                  )}
                  aria-label={buildDayAriaLabel(cell.date, day)}
                  aria-current={isSelected ? "date" : undefined}
                >
                  <span className="text-sm font-medium">{DateTime.fromISO(cell.date).toFormat("d")}</span>
                  {day && cell.isCurrentMonth ? (
                    <span
                      className={cn(
                        "mt-0.5 text-[10px] font-semibold tabular-nums",
                        isSelected ? "text-white/90" : "text-muted-foreground",
                      )}
                    >
                      {day.activeBookingCount > 0
                        ? day.activeBookingCount
                        : day.bookingCount > 0
                          ? day.bookingCount
                          : null}
                    </span>
                  ) : null}
                  {day?.isClosed && cell.isCurrentMonth ? (
                    <span
                      className={cn(
                        "mt-0.5 size-1 rounded-full",
                        day.closedReason === "holiday" ? "bg-warning" : "bg-muted-foreground/60",
                        isSelected && "bg-white/80",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-warning" />
              Holiday / closure
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-muted-foreground/60" />
              Regular closed day
            </span>
            <span>Number = open appointments</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {selectedDay ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-2 pb-3">
              <CardTitle className="text-base font-semibold">{formatDate(selectedDay.date)}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {selectedDay.isClosed ? (
                  <StatusBadge tone="warning">
                    {selectedDay.closedReason === "holiday"
                      ? selectedDay.holiday?.label ?? "Branch holiday"
                      : "Shop closed"}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="success">Open for bookings</StatusBadge>
                )}
                {selectedDay.storeHoursLabel ? (
                  <span>Hours: {selectedDay.storeHoursLabel}</span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDay.bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments on this day.</p>
              ) : (
                <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
                  {selectedDay.bookings.map((booking) => (
                    <li key={booking.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {formatBookingTimeRange(booking.scheduledStart, booking.scheduledEnd)}
                        </p>
                        <p className="text-sm">
                          <Link href={`/customers/${booking.customerId}`} className="font-medium text-brand-navy hover:underline">
                            {booking.customerName}
                          </Link>
                          <span className="text-muted-foreground"> · {booking.vehicleLabel}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getBookingServiceKindLabel(booking.serviceKind)}
                          {booking.customerConcern ? ` — ${booking.customerConcern}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge tone={getBookingStatusTone(booking.status)} variant="table">
                          {getBookingStatusLabel(booking.status)}
                        </StatusBadge>
                        <BookingRowActions booking={booking} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Upcoming appointments</CardTitle>
            <p className="text-sm text-muted-foreground">
              Requested and confirmed visits across the next dates — use the list view for search and bulk review.
            </p>
          </CardHeader>
          <CardContent>
            {calendar.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            ) : (
              <ul className="space-y-3">
                {calendar.upcoming.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/15 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(booking.scheduledStart)} ·{" "}
                        {formatBookingTimeRange(booking.scheduledStart, booking.scheduledEnd)}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {booking.customerName} · {booking.vehicleLabel}
                      </p>
                    </div>
                    <StatusBadge tone={getBookingStatusTone(booking.status)} variant="table">
                      {getBookingStatusLabel(booking.status)}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function buildDayAriaLabel(date: string, day: BookingsCalendarData["days"][number] | null | undefined) {
  const base = formatDate(date);

  if (!day) {
    return base;
  }

  const parts = [base];

  if (day.isClosed) {
    parts.push(day.closedReason === "holiday" ? "holiday" : "closed");
  }

  if (day.bookingCount > 0) {
    parts.push(`${day.bookingCount} booking${day.bookingCount === 1 ? "" : "s"}`);
  }

  return parts.join(", ");
}
