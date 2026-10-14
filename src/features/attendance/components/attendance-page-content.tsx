"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { FormStatusMessage } from "@/components/shared/form-status";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions } from "@/components/shared/page-header-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceAmendmentsPageContent } from "@/features/attendance/components/attendance-amendments-page-content";
import { AttendanceDatePicker, buildAttendanceCalendarCells } from "@/features/attendance/components/attendance-date-picker";
import { AttendanceDayRowActions } from "@/features/attendance/components/attendance-day-row-actions";
import { AttendanceDaySummaryBar } from "@/features/attendance/components/attendance-day-summary-bar";
import { ApprovedLeaveManagementSection } from "@/features/attendance/components/approved-leave-management-section";
import { AttendanceRosterRowActions } from "@/features/attendance/components/attendance-roster-row-actions";
import { AttendanceRosterScheduleCell } from "@/features/attendance/components/attendance-roster-schedule-cell";
import { AttendanceRosterStaffCell } from "@/features/attendance/components/attendance-roster-staff-cell";
import { AttendanceRosterSummaryBar } from "@/features/attendance/components/attendance-roster-summary-bar";
import {
  ATTENDANCE_WORKSPACE_FILTER_GRID,
  AttendanceWorkspacePanel,
  AttendanceWorkspaceTableShell,
} from "@/features/attendance/components/attendance-workspace-panel";
import type {
  AttendanceFilterStatus,
  AttendancePageData,
  AttendanceRosterItem,
  BranchHolidaySummary,
  RosterFilterStatus,
} from "@/features/attendance/types";
import {
  ATTENDANCE_FILTER_OPTIONS,
  ATTENDANCE_ROLE_OPTIONS,
  ROSTER_FILTER_OPTIONS,
  canEditAttendanceForLockedPeriod,
  formatAttendanceLockMessage,
  formatAttendanceStatusLabel,
  formatAttendanceTime,
  formatBranchHolidayStatusLabel,
  formatLeaveDateRange,
  formatRosterExceptionLabel,
  formatRosterExceptionTooltip,
  formatStaffLeaveTypeLabel,
  getAttendanceStatusTone,
  getDefaultAttendanceDate,
} from "@/features/attendance/utils";
import { stripSandboxBasePath } from "@/features/sandbox/constants";
import { formatDate } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AttendancePageContent({ data }: { data: AttendancePageData }) {
  const pathname = stripSandboxBasePath(usePathname());
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leaveManagement, rosterData, attendanceData, attendanceCalendar, amendmentsReview } = data;
  const today = getDefaultAttendanceDate();
  const selectedDate = attendanceCalendar.selectedDate;
  const selectedDateLabel = formatDate(selectedDate);
  const activeTab = resolveAttendanceTab(searchParams.get("tab"));
  const feedbackError = searchParams.get("error");
  const selectedMonth = DateTime.fromISO(attendanceCalendar.monthStartDate);
  const isBranchHolidayDate = attendanceData.branchHoliday !== null;
  const yearOptions = buildYearOptions(selectedMonth.year, DateTime.fromISO(today).year);
  const calendarCells = buildAttendanceCalendarCells(
    attendanceCalendar.days,
    attendanceCalendar.monthStartDate,
  );
  const rosterPagination = paginateItems(
    rosterData.roster,
    searchParams.get("rosterPage") ?? undefined,
  );
  const attendancePagination = paginateItems(
    attendanceData.roster,
    searchParams.get("attendancePage") ?? undefined,
  );
  const hasAttendanceFilters = Boolean(
    attendanceData.filters.search || attendanceData.filters.status || attendanceData.filters.role,
  );
  const hasRosterFilters = Boolean(
    rosterData.filters.search || rosterData.filters.role || rosterData.filters.rosterStatus,
  );

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function updateTab(nextTab: string) {
    updateParams((params) => {
      if (nextTab === "attendance") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }
    });
  }

  function updateSelectedDate(nextDate: string) {
    updateParams((params) => {
      params.set("date", nextDate);
      params.set("month", DateTime.fromISO(nextDate).toFormat("yyyy-LL"));
      params.delete("attendancePage");
      params.delete("rosterPage");
    });
  }

  function navigateMonth(offset: number) {
    const nextMonth = selectedMonth.plus({ months: offset }).startOf("month");
    updateParams((params) => {
      params.set("month", nextMonth.toFormat("yyyy-LL"));
      params.set("date", nextMonth.toFormat("yyyy-LL-dd"));
      params.delete("attendancePage");
      params.delete("rosterPage");
    });
  }

  function updateMonthSelection(nextMonth: number, nextYear: number) {
    const nextDate = DateTime.fromObject({ year: nextYear, month: nextMonth, day: 1 });

    if (!nextDate.isValid) {
      return;
    }

    updateParams((params) => {
      params.set("month", nextDate.toFormat("yyyy-LL"));
      params.set("date", nextDate.toFormat("yyyy-LL-dd"));
      params.delete("attendancePage");
      params.delete("rosterPage");
    });
  }

  function applyAttendanceStatusFilter(status: AttendanceFilterStatus) {
    updateParams((params) => {
      if (attendanceData.filters.status === status) {
        params.delete("attendanceStatus");
      } else {
        params.set("attendanceStatus", status);
      }

      params.delete("attendancePage");
    });
  }

  function clearAttendanceFilters() {
    updateParams((params) => {
      params.delete("attendanceSearch");
      params.delete("attendanceStatus");
      params.delete("attendanceRole");
      params.delete("attendancePage");
    });
  }

  function applyRosterStatusFilter(status: RosterFilterStatus | "") {
    updateParams((params) => {
      if (status) {
        params.set("rosterStatus", status);
      } else {
        params.delete("rosterStatus");
      }

      params.delete("rosterPage");
    });
  }

  function clearRosterFilters() {
    updateParams((params) => {
      params.delete("rosterSearch");
      params.delete("rosterRole");
      params.delete("rosterStatus");
      params.delete("rosterPage");
    });
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-0 overflow-x-hidden">
      <PageHeader
        title="Attendance"
        description={`Daily time records and roster controls for ${selectedDateLabel}.`}
        actions={
          selectedDate !== today ? (
            <PageHeaderActions
              primary={
                <Button asChild variant="outline">
                  <Link href="/attendance">Today</Link>
                </Button>
              }
            />
          ) : undefined
        }
      />

      <Tabs
        defaultValue="attendance"
        value={activeTab}
        onValueChange={updateTab}
        className="mt-6 w-full min-w-0 max-w-full overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="amendments" count={amendmentsReview.pendingCount || undefined}>
            Review Amendments
          </TabsTrigger>
          <TabsTrigger value="leave">Approved leave</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="w-full min-w-0 max-w-full overflow-x-hidden">
          <FormStatusMessage message={feedbackError ?? undefined} />

          {attendanceData.lockedPeriod ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {formatAttendanceLockMessage(attendanceData.lockedPeriod)}
            </div>
          ) : null}

          <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-[minmax(220px,30%)_minmax(0,1fr)]">
            <div className="min-w-0 xl:border-r xl:border-border/70 xl:pr-6">
              <AttendanceDatePicker
                monthLabel={attendanceCalendar.monthLabel}
                selectedMonth={selectedMonth}
                selectedDate={selectedDate}
                today={today}
                yearOptions={yearOptions}
                calendarCells={calendarCells}
                selectedHoliday={attendanceData.branchHoliday}
                onSelectDate={updateSelectedDate}
                onNavigateMonth={navigateMonth}
                onMonthSelectionChange={updateMonthSelection}
              />
            </div>

            <AttendanceWorkspacePanel
              contextBar={
                <AttendanceDaySummaryBar
                  summary={attendanceData.summary}
                  activeFilter={attendanceData.filters.status}
                  onFilterChange={applyAttendanceStatusFilter}
                  isBranchHolidayDate={isBranchHolidayDate}
                />
              }
              toolbar={
                <DataTableFilters
                  key={`${attendanceData.filters.search}:${attendanceData.filters.status}:${attendanceData.filters.role}:${attendanceData.filters.date}`}
                  className={ATTENDANCE_WORKSPACE_FILTER_GRID}
                  pageParamName="attendancePage"
                  search={{
                    name: "attendanceSearch",
                    value: attendanceData.filters.search,
                    placeholder: "Search by staff name",
                  }}
                  filters={[
                    {
                      type: "select",
                      name: "attendanceStatus",
                      value: attendanceData.filters.status,
                      options: [
                        { value: "", label: "All attendance states" },
                        ...ATTENDANCE_FILTER_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        })),
                      ],
                    },
                    {
                      type: "select",
                      name: "attendanceRole",
                      value: attendanceData.filters.role,
                      options: [
                        { value: "", label: "All roles" },
                        ...ATTENDANCE_ROLE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        })),
                      ],
                    },
                  ]}
                />
              }
              footer={
                <DataTablePagination
                  page={attendancePagination.page}
                  pageSize={attendancePagination.pageSize}
                  totalItems={attendancePagination.totalItems}
                  totalPages={attendancePagination.totalPages}
                  startItem={attendancePagination.startItem}
                  endItem={attendancePagination.endItem}
                  pageParamName="attendancePage"
                />
              }
            >
              <AttendanceWorkspaceTableShell
                isEmpty={attendancePagination.totalItems === 0}
                emptyState={
                  <EmptyState
                    title={getAttendanceEmptyTitle({
                      hasFilters: hasAttendanceFilters,
                      isBranchHolidayDate,
                    })}
                    description={getAttendanceEmptyDescription({
                      hasFilters: hasAttendanceFilters,
                      isBranchHolidayDate,
                      selectedDateLabel,
                    })}
                    action={
                      hasAttendanceFilters ? (
                        <Button type="button" variant="outline" onClick={clearAttendanceFilters}>
                          Clear filters
                        </Button>
                      ) : selectedDate !== today ? (
                        <Button asChild variant="outline">
                          <Link href="/attendance">Go to today</Link>
                        </Button>
                      ) : undefined
                    }
                  />
                }
              >
                <Table className="min-w-[640px] table-auto [&_th]:px-4 [&_th]:tracking-[0.12em] [&_td]:px-4 [&_td]:py-5 2xl:min-w-[920px] 2xl:[&_th]:px-5 2xl:[&_th]:tracking-[0.16em] 2xl:[&_td]:px-5">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px] 2xl:min-w-[220px]">Staff</TableHead>
                      <TableHead className="min-w-[180px] 2xl:min-w-[220px]">Status</TableHead>
                      <TableHead className="min-w-[170px] 2xl:hidden">Time</TableHead>
                      <TableHead className="hidden min-w-[148px] whitespace-nowrap 2xl:table-cell">Time in</TableHead>
                      <TableHead className="hidden min-w-[148px] whitespace-nowrap 2xl:table-cell">Time out</TableHead>
                      <TableHead className="w-[72px] min-w-[72px] px-4 text-right 2xl:px-5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendancePagination.items.map((item) => (
                      <TableRow key={item.staffId}>
                        <TableCell className="min-w-[180px] align-top 2xl:min-w-[220px]">
                          <p className="font-semibold leading-snug text-foreground">{item.fullName}</p>
                        </TableCell>
                        <TableCell className="min-w-[180px] align-top 2xl:min-w-[220px]">
                          <div className="space-y-1.5">
                            {attendanceData.branchHoliday && !item.attendance ? (
                              <StatusBadge
                                tone="neutral"
                                className={getBranchHolidayBadgeClass(attendanceData.branchHoliday)}
                              >
                                {formatBranchHolidayStatusLabel(attendanceData.branchHoliday)}
                              </StatusBadge>
                            ) : (
                              <StatusBadge
                                tone={getAttendanceStatusTone(item.attendance?.status ?? "unrecorded")}
                              >
                                {formatAttendanceStatusLabel(item.attendance?.status ?? "unrecorded")}
                              </StatusBadge>
                            )}
                            {item.leaveEntry ? (
                              <p className="text-xs font-medium text-sky-700">
                                Approved leave · {formatStaffLeaveTypeLabel(item.leaveEntry.leaveType)} ·{" "}
                                {formatLeaveDateRange(item.leaveEntry)}
                              </p>
                            ) : null}
                            {item.hasMissingTimeout && !attendanceData.branchHoliday ? (
                              <p className="text-xs font-medium text-amber-700">Time out still missing</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[170px] align-top text-sm text-muted-foreground 2xl:hidden">
                          <div className="space-y-1">
                            <p className="leading-none">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                In:
                              </span>{" "}
                              <span>{formatAttendanceTableTime(item.attendance?.timeIn)}</span>
                            </p>
                            <p className="leading-none">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Out:
                              </span>{" "}
                              <span>{formatAttendanceTableTime(item.attendance?.timeOut)}</span>
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden min-w-[148px] whitespace-nowrap align-top text-sm text-muted-foreground 2xl:table-cell">
                          {formatAttendanceTableTime(item.attendance?.timeIn)}
                        </TableCell>
                        <TableCell className="hidden min-w-[148px] whitespace-nowrap align-top text-sm text-muted-foreground 2xl:table-cell">
                          {formatAttendanceTableTime(item.attendance?.timeOut)}
                        </TableCell>
                        <TableCell className="w-[72px] min-w-[72px] px-4 align-top text-right 2xl:px-5">
                          <AttendanceDayRowActions
                            attendance={item.attendance}
                            attendanceDate={attendanceData.filters.date}
                            canEdit={canEditAttendanceForLockedPeriod(attendanceData.lockedPeriod)}
                            staffId={item.staffId}
                            staffName={item.fullName}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AttendanceWorkspaceTableShell>
            </AttendanceWorkspacePanel>
          </div>
        </TabsContent>

        <TabsContent value="roster" className="w-full min-w-0 max-w-full overflow-x-hidden">
          <AttendanceWorkspacePanel
            contextBar={
              <AttendanceRosterSummaryBar
                summary={rosterData.summary}
                activeFilter={rosterData.filters.rosterStatus}
                onFilterChange={applyRosterStatusFilter}
              />
            }
            toolbar={
              <DataTableFilters
                key={`${rosterData.filters.search}:${rosterData.filters.role}:${rosterData.filters.date}:${rosterData.filters.rosterStatus}`}
                className={ATTENDANCE_WORKSPACE_FILTER_GRID}
                pageParamName="rosterPage"
                search={{
                  name: "rosterSearch",
                  value: rosterData.filters.search,
                  placeholder: "Search by staff name",
                }}
                filters={[
                  {
                    type: "select",
                    name: "rosterRole",
                    value: rosterData.filters.role,
                    options: [
                      { value: "", label: "All roles" },
                      ...ATTENDANCE_ROLE_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ],
                  },
                  {
                    type: "select",
                    name: "rosterStatus",
                    value: rosterData.filters.rosterStatus,
                    options: [
                      { value: "", label: "All statuses" },
                      ...ROSTER_FILTER_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ],
                  },
                  {
                    type: "date",
                    name: "date",
                    value: rosterData.filters.date,
                  },
                ]}
              />
            }
            footer={
              <DataTablePagination
                page={rosterPagination.page}
                pageSize={rosterPagination.pageSize}
                totalItems={rosterPagination.totalItems}
                totalPages={rosterPagination.totalPages}
                startItem={rosterPagination.startItem}
                endItem={rosterPagination.endItem}
                pageParamName="rosterPage"
              />
            }
          >
            <AttendanceWorkspaceTableShell
              isEmpty={rosterPagination.totalItems === 0}
              emptyState={
                <EmptyState
                  title={hasRosterFilters ? "No staff match your filters" : "No roster entries found"}
                  description={
                    hasRosterFilters
                      ? "Try a different search term, role, or status filter."
                      : "Active staff will appear here for the selected date."
                  }
                  action={
                    hasRosterFilters ? (
                      <Button type="button" variant="outline" onClick={clearRosterFilters}>
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              }
            >
              <Table className="min-w-[640px] xl:min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Exception</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rosterPagination.items.map((item) => {
                    const exceptionLabel = formatRosterExceptionLabel(item, rosterData.branchHoliday);
                    const exceptionTooltip = formatRosterExceptionTooltip(item, rosterData.branchHoliday);
                    const rowNotes = resolveRosterRowNotes(item, rosterData.branchHoliday);

                    return (
                      <TableRow key={item.staffId}>
                        <TableCell className="min-w-[180px]">
                          <AttendanceRosterStaffCell fullName={item.fullName} />
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <AttendanceRosterScheduleCell
                            staffId={item.staffId}
                            staffName={item.fullName}
                            schedule={item.schedule}
                          />
                        </TableCell>
                        <TableCell className="min-w-[140px] text-sm">
                          {exceptionLabel ? (
                            exceptionTooltip ? (
                              <Tooltip content={exceptionTooltip}>
                                <span className="font-medium text-foreground">{exceptionLabel}</span>
                              </Tooltip>
                            ) : (
                              <span className="font-medium text-foreground">{exceptionLabel}</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="w-24 px-2 text-right">
                          <AttendanceRosterRowActions
                            staffId={item.staffId}
                            staffName={item.fullName}
                            schedule={item.schedule}
                            notes={rowNotes}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AttendanceWorkspaceTableShell>
          </AttendanceWorkspacePanel>
        </TabsContent>

        <TabsContent value="amendments" className="w-full min-w-0 max-w-full overflow-x-hidden">
          <AttendanceAmendmentsPageContent
            data={amendmentsReview}
            embedded
            paramPrefix="amendment"
          />
        </TabsContent>

        <TabsContent value="leave" className="w-full min-w-0 max-w-full overflow-x-hidden">
          <ApprovedLeaveManagementSection data={leaveManagement} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function buildYearOptions(selectedYear: number, currentYear: number) {
  const startYear = Math.min(selectedYear, currentYear) - 1;
  const endYear = Math.max(selectedYear, currentYear) + 1;

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}

function getAttendanceEmptyTitle({
  hasFilters,
  isBranchHolidayDate,
}: {
  hasFilters: boolean;
  isBranchHolidayDate: boolean;
}) {
  if (hasFilters) {
    return "No staff match your filters";
  }

  if (isBranchHolidayDate) {
    return "No punch records on this date";
  }

  return "No staff to review";
}

function getAttendanceEmptyDescription({
  hasFilters,
  isBranchHolidayDate,
  selectedDateLabel,
}: {
  hasFilters: boolean;
  isBranchHolidayDate: boolean;
  selectedDateLabel: string;
}) {
  if (hasFilters) {
    return "Try a different search term, attendance state, or role filter.";
  }

  if (isBranchHolidayDate) {
    return "Attendance is not required on this branch calendar date. Staff with real punch records will appear here when they work during the closure or holiday.";
  }

  return `No active staff are listed for ${selectedDateLabel}. Check the Roster tab for schedule and leave setup.`;
}

function formatAttendanceTableTime(value: string | null | undefined) {
  return value ? formatAttendanceTime(value) : "—";
}

function getBranchHolidayBadgeClass(holiday: BranchHolidaySummary) {
  switch (holiday.holidayKind) {
    case "branch_closure":
      return "border-transparent bg-sky-100 text-sky-800";
    case "public_holiday":
    case "company_holiday":
      return "border-transparent bg-violet-100 text-violet-800";
    case "special_non_working_day":
      return "border-transparent bg-amber-100 text-amber-800";
  }
}

function resolveRosterRowNotes(
  item: AttendanceRosterItem,
  branchHoliday: BranchHolidaySummary | null,
) {
  return item.schedule?.notes?.trim() || item.leaveEntry?.notes?.trim() || branchHoliday?.notes?.trim() || null;
}

function resolveAttendanceTab(tab: string | null) {
  if (tab === "roster" || tab === "amendments" || tab === "leave") {
    return tab;
  }

  return "attendance";
}
