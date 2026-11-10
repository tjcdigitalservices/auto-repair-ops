"use client";

import { DateTime } from "luxon";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { BookingRowActions } from "@/features/bookings/components/booking-row-actions";
import {
  buildBookingCalendarCells,
  formatBookingTimeRange,
} from "@/features/bookings/bookings-calendar-utils";
import type { BookingListItem, BookingsCalendarData } from "@/features/bookings/types";
import {
  getBookingServiceKindLabel,
  getBookingStatusLabel,
  getBookingStatusTone,
} from "@/features/bookings/utils";
import { stripSandboxBasePath } from "@/features/sandbox/constants";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MAX_VISIBLE_EVENTS = 2;

export function BookingsCalendarView({ calendar }: { calendar: BookingsCalendarData }) {
  const pathname = stripSandboxBasePath(usePathname());
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDay =
    calendar.days.find((day) => day.date === calendar.selectedDate) ?? calendar.days[0];
  const calendarCells = buildBookingCalendarCells(calendar.days, calendar.monthStartDate);
  const weekRows = chunkIntoWeeks(calendarCells);
  const selectedDateLabel = selectedDay
    ? DateTime.fromISO(selectedDay.date).toFormat("EEE, MMM d")
    : null;

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

  function goToToday() {
    const todayMonth = DateTime.fromISO(calendar.today).toFormat("yyyy-MM");
    updateParams({
      month: todayMonth,
      date: calendar.today,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row lg:gap-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.08),0_1px_3px_1px_rgba(60,64,67,0.06)]">
        <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-[#dadce0] px-3 py-2 sm:px-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-[#dadce0] bg-white px-3 text-sm font-medium text-[#3c4043] shadow-none hover:bg-[#f8f9fa]"
            onClick={goToToday}
          >
            Today
          </Button>

          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-[#3c4043] hover:bg-[#f1f3f4]"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-[#3c4043] hover:bg-[#f1f3f4]"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <h2 className="min-w-0 flex-1 text-lg font-normal tracking-tight text-[#3c4043] sm:text-xl">
            {calendar.monthLabel}
          </h2>

          <div className="hidden items-center gap-2 xl:flex">
            <LegendSwatch className="bg-[#039be5]" label="Confirmed" />
            <LegendSwatch className="bg-[#f6bf26]" label="Requested" />
            <LegendSwatch className="bg-[#33b679]" label="Checked in" />
            <LegendSwatch className="bg-[#e67c73]" label="Closed" />
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-7 border-b border-[#dadce0]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-1 py-1.5 text-center text-[10px] font-medium uppercase tracking-[0.06em] text-[#70757a] sm:text-[11px]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {weekRows.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              className="grid min-h-0 flex-1 grid-cols-7 border-b border-[#dadce0] last:border-b-0"
            >
              {week.map((cell, cellIndex) => {
                const day = cell.day;
                const isSelected = cell.date === calendar.selectedDate;
                const isToday = cell.date === calendar.today;
                const dateTime = DateTime.fromISO(cell.date);
                const isMonthStart = dateTime.day === 1;
                const dayNumberLabel = isMonthStart
                  ? dateTime.toFormat("MMM d")
                  : dateTime.toFormat("d");
                const visibleBookings = (day?.bookings ?? []).slice(0, MAX_VISIBLE_EVENTS);
                const hiddenCount = Math.max((day?.bookings.length ?? 0) - MAX_VISIBLE_EVENTS, 0);

                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={!cell.isCurrentMonth}
                    onClick={() => updateParams({ date: cell.date })}
                    className={cn(
                      "group relative flex min-h-0 flex-col gap-0.5 overflow-hidden border-r border-[#dadce0] p-1 text-left transition-colors last:border-r-0 sm:p-1.5",
                      cellIndex === 6 && "border-r-0",
                      !cell.isCurrentMonth && "bg-[#f8f9fa]",
                      cell.isCurrentMonth && "hover:bg-[#f8f9fa]",
                      isSelected && cell.isCurrentMonth && "bg-[#e8f0fe]",
                      day?.isClosed && cell.isCurrentMonth && !isSelected && "bg-[#fafafa]",
                    )}
                    aria-label={buildDayAriaLabel(cell.date, day)}
                    aria-current={isSelected ? "date" : undefined}
                  >
                    <div className="flex shrink-0 items-center justify-end">
                      <span
                        className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] tabular-nums leading-none sm:h-7 sm:min-w-7 sm:text-[12px]",
                          isToday && "bg-[#1a73e8] font-medium text-white",
                          !isToday && isSelected && "bg-[#d2e3fc] font-medium text-[#174ea6]",
                          !isToday &&
                            !isSelected &&
                            cell.isCurrentMonth &&
                            "font-medium text-[#3c4043]",
                          !cell.isCurrentMonth && "font-medium text-[#70757a]/70",
                          isMonthStart && !isToday && "px-1.5",
                        )}
                      >
                        {dayNumberLabel}
                      </span>
                    </div>

                    {day?.isClosed && cell.isCurrentMonth ? (
                      <span className="truncate px-0.5 text-[9px] font-medium leading-tight text-[#e37400] sm:text-[10px]">
                        {day.closedReason === "holiday"
                          ? day.holiday?.label ?? "Holiday"
                          : "Closed"}
                      </span>
                    ) : null}

                    <div className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-hidden">
                      {visibleBookings.map((booking) => (
                        <span
                          key={booking.id}
                          className={cn(
                            "truncate rounded-[3px] px-1 py-[2px] text-[10px] font-medium leading-tight tracking-[-0.01em] text-white sm:text-[11px]",
                            bookingEventChipClassName(booking.status),
                          )}
                          title={bookingEventLabel(booking)}
                        >
                          <span className="opacity-95">
                            {formatBookingChipTime(booking.scheduledStart)}
                          </span>{" "}
                          {booking.customerName}
                        </span>
                      ))}
                      {hiddenCount > 0 ? (
                        <span className="px-0.5 text-[10px] font-medium text-[#70757a] group-hover:text-[#3c4043]">
                          +{hiddenCount} more
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <aside className="flex max-h-[40vh] min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.06)] lg:max-h-none lg:w-[20.5rem] xl:w-[22rem]">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {selectedDay ? (
            <section className="border-b border-[#e8eaed] p-3.5 sm:p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#70757a]">
                    Selected day
                  </p>
                  <h3 className="mt-0.5 text-base font-medium tracking-tight text-[#3c4043]">
                    {selectedDateLabel}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  {selectedDay.isClosed ? (
                    <StatusBadge tone="warning">
                      {selectedDay.closedReason === "holiday"
                        ? selectedDay.holiday?.label ?? "Holiday"
                        : "Closed"}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="success">Open</StatusBadge>
                  )}
                  {selectedDay.storeHoursLabel ? (
                    <span className="text-[11px] text-[#70757a]">{selectedDay.storeHoursLabel}</span>
                  ) : null}
                </div>
              </div>

              {selectedDay.bookings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#dadce0] bg-[#f8f9fa] px-3 py-5 text-center">
                  <p className="text-sm font-medium text-[#3c4043]">No appointments</p>
                  <p className="mt-1 text-xs text-[#70757a]">This day is clear.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {selectedDay.bookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="rounded-lg border border-[#e8eaed] px-2.5 py-2.5 transition-colors hover:bg-[#f8f9fa]/80"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "mt-1 h-8 w-1 shrink-0 rounded-full",
                            bookingEventBarClassName(booking.status),
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold tabular-nums text-[#3c4043]">
                              {formatBookingTimeRange(booking.scheduledStart, booking.scheduledEnd)}
                            </p>
                            <BookingRowActions booking={booking} />
                          </div>
                          <p className="truncate text-sm">
                            <Link
                              href={`/customers/${booking.customerId}`}
                              className="font-medium text-[#174ea6] hover:underline"
                            >
                              {booking.customerName}
                            </Link>
                          </p>
                          <p className="truncate text-xs text-[#70757a]">
                            {booking.vehicleLabel} · {getBookingServiceKindLabel(booking.serviceKind)}
                          </p>
                          {booking.customerConcern ? (
                            <p className="line-clamp-2 text-xs text-[#9aa0a6]">
                              {booking.customerConcern}
                            </p>
                          ) : null}
                          <StatusBadge tone={getBookingStatusTone(booking.status)} variant="table">
                            {getBookingStatusLabel(booking.status)}
                          </StatusBadge>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <section className="p-3.5 sm:p-4">
            <div className="mb-2">
              <h3 className="text-sm font-medium tracking-tight text-[#3c4043]">Upcoming</h3>
              <p className="text-xs text-[#70757a]">Next visits on the books</p>
            </div>

            {calendar.upcoming.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#70757a]">No upcoming appointments.</p>
            ) : (
              <ul className="space-y-0.5">
                {calendar.upcoming.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-start gap-2.5 rounded-lg px-1.5 py-2 transition-colors hover:bg-[#f8f9fa]"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-[3px]",
                        bookingEventBarClassName(booking.status),
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#3c4043]">
                        {booking.customerName}
                      </p>
                      <p className="truncate text-xs text-[#70757a]">
                        {DateTime.fromISO(booking.scheduledStart).toFormat("MMM d")} ·{" "}
                        {formatBookingChipTime(booking.scheduledStart)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5f6368]">
      <span className={cn("size-2.5 rounded-[3px]", className)} />
      {label}
    </span>
  );
}

function chunkIntoWeeks<T>(cells: T[]) {
  const weeks: T[][] = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

function formatBookingChipTime(iso: string, zone = "Asia/Manila") {
  const time = DateTime.fromISO(iso).setZone(zone);
  const pattern = time.minute === 0 ? "ha" : "h:mma";
  return time.toFormat(pattern).toLowerCase();
}

function bookingEventLabel(booking: BookingListItem) {
  return `${formatBookingTimeRange(booking.scheduledStart, booking.scheduledEnd)} · ${booking.customerName} · ${booking.vehicleLabel}`;
}

function bookingEventChipClassName(status: BookingListItem["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-[#039be5]";
    case "requested":
      return "bg-[#f6bf26] text-[#3c4043]";
    case "checked_in":
      return "bg-[#33b679]";
    case "cancelled":
      return "bg-[#9aa0a6] line-through opacity-80";
    case "no_show":
      return "bg-[#e67c73]";
    default:
      return "bg-[#9aa0a6]";
  }
}

function bookingEventBarClassName(status: BookingListItem["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-[#039be5]";
    case "requested":
      return "bg-[#f6bf26]";
    case "checked_in":
      return "bg-[#33b679]";
    case "cancelled":
      return "bg-[#9aa0a6]";
    case "no_show":
      return "bg-[#e67c73]";
    default:
      return "bg-[#9aa0a6]";
  }
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
