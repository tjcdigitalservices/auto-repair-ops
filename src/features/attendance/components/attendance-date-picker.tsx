"use client";

import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type {
  AttendanceCalendarDaySummary,
  BranchHolidaySummary,
} from "@/features/attendance/types";
import {
  formatBranchHolidayStatusLabel,
  formatBranchHolidayPayTreatmentLabel,
} from "@/features/attendance/utils";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Shape exposed for a future holiday detail popover or side panel. */
export type AttendanceCalendarHolidayContext = Pick<
  BranchHolidaySummary,
  "id" | "branchId" | "holidayDate" | "label" | "holidayKind" | "payTreatment" | "notes"
>;

export type AttendanceCalendarCell = {
  date: string;
  isCurrentMonth: boolean;
  day: AttendanceCalendarDaySummary | null;
  holiday: AttendanceCalendarHolidayContext | null;
};

export function AttendanceDatePicker({
  monthLabel,
  selectedMonth,
  selectedDate,
  today,
  yearOptions,
  calendarCells,
  selectedHoliday,
  onSelectDate,
  onNavigateMonth,
  onMonthSelectionChange,
}: {
  monthLabel: string;
  selectedMonth: DateTime;
  selectedDate: string;
  today: string;
  yearOptions: number[];
  calendarCells: AttendanceCalendarCell[];
  selectedHoliday: BranchHolidaySummary | null;
  onSelectDate: (date: string) => void;
  onNavigateMonth: (offset: number) => void;
  onMonthSelectionChange: (month: number, year: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onNavigateMonth(-1)}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onNavigateMonth(1)}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NativeSelect
          aria-label="Select attendance month"
          value={String(selectedMonth.month)}
          className="h-9 text-sm"
          onChange={(event) =>
            onMonthSelectionChange(Number(event.target.value), selectedMonth.year)
          }
        >
          {Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;

            return (
              <option key={month} value={month}>
                {DateTime.fromObject({ year: 2026, month, day: 1 }).toFormat("LLLL")}
              </option>
            );
          })}
        </NativeSelect>
        <NativeSelect
          aria-label="Select attendance year"
          value={String(selectedMonth.year)}
          className="h-9 text-sm"
          onChange={(event) =>
            onMonthSelectionChange(selectedMonth.month, Number(event.target.value))
          }
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="py-1 text-[11px] font-medium uppercase text-muted-foreground"
          >
            {label}
          </div>
        ))}

        {calendarCells.map((cell) => (
          <button
            key={cell.date}
            type="button"
            onClick={() => onSelectDate(cell.date)}
            className={cn(
              "mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors",
              getCalendarDayButtonClass(cell, selectedDate, today),
            )}
            aria-label={buildAttendanceCalendarDayAriaLabel(cell)}
            aria-current={cell.date === selectedDate ? "date" : undefined}
            {...getHolidayDataAttributes(cell.holiday)}
          >
            {DateTime.fromISO(cell.date).toFormat("d")}
          </button>
        ))}
      </div>

      {selectedHoliday ? (
        <AttendanceCalendarHolidayLegend
          holiday={selectedHoliday}
          selectedDate={selectedDate}
        />
      ) : null}
    </div>
  );
}

function AttendanceCalendarHolidayLegend({
  holiday,
  selectedDate,
}: {
  holiday: BranchHolidaySummary;
  selectedDate: string;
}) {
  const showDatePrefix = holiday.holidayDate === selectedDate;

  return (
    <div className="space-y-1 border-t border-border/70 pt-3 text-xs text-muted-foreground">
      <p className="font-medium uppercase tracking-wide text-muted-foreground">Holiday</p>
      <p className="text-sm text-foreground">
        {showDatePrefix ? (
          <>
            {formatDate(holiday.holidayDate)} · {holiday.label}
          </>
        ) : (
          <>· {holiday.label}</>
        )}
      </p>
    </div>
  );
}

export function buildAttendanceCalendarCells(
  days: AttendanceCalendarDaySummary[],
  monthStartDate: string,
): AttendanceCalendarCell[] {
  const monthStart = DateTime.fromISO(monthStartDate);

  if (!monthStart.isValid) {
    return [];
  }

  const dayByDate = new Map(days.map((day) => [day.date, day]));
  const leadingCount = monthStart.weekday % 7;
  const daysInMonth = monthStart.daysInMonth ?? days.length;
  const cells: AttendanceCalendarCell[] = [];

  for (let index = leadingCount - 1; index >= 0; index -= 1) {
    const date = monthStart.minus({ days: index + 1 }).toFormat("yyyy-LL-dd");
    cells.push(buildCalendarCell(date, false, dayByDate.get(date) ?? null));
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const date = monthStart.set({ day: dayNumber }).toFormat("yyyy-LL-dd");
    cells.push(buildCalendarCell(date, true, dayByDate.get(date) ?? null));
  }

  const trailingCount = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  const monthEnd = monthStart.endOf("month");

  for (let index = 1; index <= trailingCount; index += 1) {
    const date = monthEnd.plus({ days: index }).toFormat("yyyy-LL-dd");
    cells.push(buildCalendarCell(date, false, dayByDate.get(date) ?? null));
  }

  return cells;
}

function buildCalendarCell(
  date: string,
  isCurrentMonth: boolean,
  day: AttendanceCalendarDaySummary | null,
): AttendanceCalendarCell {
  return {
    date,
    isCurrentMonth,
    day,
    holiday: day?.branchHoliday ? toHolidayContext(day.branchHoliday) : null,
  };
}

export function toHolidayContext(
  holiday: BranchHolidaySummary,
): AttendanceCalendarHolidayContext {
  return {
    id: holiday.id,
    branchId: holiday.branchId,
    holidayDate: holiday.holidayDate,
    label: holiday.label,
    holidayKind: holiday.holidayKind,
    payTreatment: holiday.payTreatment,
    notes: holiday.notes,
  };
}

function getHolidayDataAttributes(holiday: AttendanceCalendarHolidayContext | null) {
  if (!holiday) {
    return {};
  }

  return {
    "data-attendance-holiday": "true",
    "data-holiday-id": holiday.id,
    "data-holiday-kind": holiday.holidayKind,
    "data-holiday-date": holiday.holidayDate,
  } as const;
}

function getCalendarDayButtonClass(
  cell: AttendanceCalendarCell,
  selectedDate: string,
  today: string,
) {
  const isSelected = cell.date === selectedDate;
  const isToday = cell.date === today;
  const isHoliday = cell.holiday !== null;

  if (isSelected) {
    return "bg-brand-navy font-semibold text-white";
  }

  if (!cell.isCurrentMonth) {
    return cn(
      "hover:bg-muted/30 hover:text-muted-foreground",
      isHoliday ? "text-red-500/70" : "text-muted-foreground/45",
    );
  }

  if (isToday) {
    return cn(
      "font-semibold ring-1 ring-brand-navy/30 hover:bg-muted/40",
      isHoliday ? "text-red-600" : "text-brand-navy",
    );
  }

  if (isHoliday) {
    return "font-medium text-red-600 hover:bg-red-50";
  }

  return "text-foreground hover:bg-muted/40";
}

function buildAttendanceCalendarDayAriaLabel(cell: AttendanceCalendarCell) {
  const formattedDate = DateTime.fromISO(cell.date).toFormat("LLLL d, yyyy");

  if (cell.holiday) {
    return `${formattedDate}. ${formatBranchHolidayStatusLabel(cell.holiday as BranchHolidaySummary)}. ${cell.holiday.label}. Pay treatment: ${formatBranchHolidayPayTreatmentLabel(cell.holiday.payTreatment)}.`;
  }

  if (!cell.isCurrentMonth) {
    return `${formattedDate}. Outside current month.`;
  }

  return formattedDate;
}
