"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BranchSelector } from "@/components/shared/branch-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { FormStatusMessage } from "@/components/shared/form-status";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceAccessSettingsForm } from "@/features/attendance/components/attendance-access-settings-form";
import { AttendanceAllowedIpDialog } from "@/features/attendance/components/attendance-allowed-ip-dialog";
import { AttendanceAllowedIpRowActions } from "@/features/attendance/components/attendance-allowed-ip-row-actions";
import { AttendanceDevicesPageContent } from "@/features/attendance/components/attendance-devices-page-content";
import { BranchHolidayDialog } from "@/features/attendance/components/branch-holiday-dialog";
import { PhilippineHolidayImportDialog } from "@/features/attendance/components/philippine-holiday-import-dialog";
import { BranchHolidayRowActions } from "@/features/attendance/components/branch-holiday-row-actions";
import {
  AttendanceWorkspaceFilterToolbar,
  AttendanceWorkspacePanel,
  AttendanceWorkspaceTableShell,
} from "@/features/attendance/components/attendance-workspace-panel";
import type {
  AttendanceAllowedIpSummary,
  BranchHolidaySummary,
  TimekeepingCalendarPageData,
} from "@/features/attendance/types";
import {
  formatBranchHolidayKindLabel,
  formatBranchHolidayPayTreatmentLabel,
} from "@/features/attendance/utils";
import { formatDate } from "@/lib/dates";
import type { PageBranchSelectorProps } from "@/lib/branches";
import { cn } from "@/lib/utils";

export function TimekeepingCalendarPageContent({
  data,
  branchSelector,
}: {
  data: TimekeepingCalendarPageData;
  branchSelector: PageBranchSelectorProps;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showBranchContext = branchSelector.showBranchContext;
  const activeTab = (() => {
    const tab = searchParams.get("tab");

    if (tab === "devices" || tab === "holidays") {
      return tab;
    }

    return "access";
  })();
  const feedbackError = searchParams.get("error");

  function updateTab(nextTab: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "access") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    params.delete("error");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-0">
      <PageHeader
        title="Timekeeping"
        description="Configure shop access rules, device approvals, and branch calendar dates."
      />

      <Tabs
        defaultValue="access"
        value={activeTab}
        onValueChange={updateTab}
        className="mt-6 min-w-0"
      >
        <TabsList>
          <TabsTrigger value="access">Access & IP</TabsTrigger>
          <TabsTrigger value="devices" count={data.pendingDeviceCount || undefined}>
            Review devices
          </TabsTrigger>
          <TabsTrigger value="holidays">Branch holidays</TabsTrigger>
        </TabsList>

        {feedbackError ? (
          <div className="pt-4">
            <FormStatusMessage message={feedbackError} />
          </div>
        ) : null}

        <TabsContent value="access" className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-base font-semibold text-foreground">
                Mechanic portal access
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enable shop IP and/or location verification for mechanic punches.
              </p>
            </CardHeader>
            <CardContent>
              <AttendanceAccessSettingsForm initialValues={data.attendanceAccessSettings} />
            </CardContent>
          </Card>

          <AttendanceWorkspacePanel
            contextBar={
              <div className={cn("grid gap-3", showBranchContext && "sm:grid-cols-2")}>
                {showBranchContext ? (
                  <TimekeepingContextCard label="Branch" value={data.branchName} />
                ) : null}
                <TimekeepingContextCard
                  label="Current public IP"
                  value={data.currentDetectedIp ?? "Unable to detect"}
                  helper={
                    data.currentDetectedIp
                      ? "Detected on this request."
                      : data.observedRequestIp
                        ? `Observed request IP: ${data.observedRequestIp}`
                        : "Public IP could not be detected on this request."
                  }
                />
              </div>
            }
            toolbar={
              <div className="flex justify-end">
                <AttendanceAllowedIpDialog currentDetectedIp={data.currentDetectedIp} />
              </div>
            }
          >
            <AttendanceWorkspaceTableShell
              isEmpty={data.allowedIpAddresses.length === 0}
              emptyState={
                <EmptyState
                  title="No approved shop IPs yet"
                  description="Add branch internet addresses used to validate on-site mechanic punches."
                />
              }
            >
              <Table className="min-w-[640px] xl:min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Public IP</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.allowedIpAddresses.map((allowedIp) => {
                    const ipStatus = resolveAllowedIpStatus(allowedIp, data.currentDetectedIp);

                    return (
                      <TableRow key={allowedIp.id}>
                        <TableCell className="font-medium text-foreground">
                          {allowedIp.ipAddress}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {allowedIp.label?.trim() || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(allowedIp.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={ipStatus.tone}>{ipStatus.label}</StatusBadge>
                        </TableCell>
                        <TableCell className="w-14 text-right">
                          <AttendanceAllowedIpRowActions allowedIp={allowedIp} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AttendanceWorkspaceTableShell>
          </AttendanceWorkspacePanel>
        </TabsContent>

        <TabsContent value="devices">
          <AttendanceDevicesPageContent data={data.devicesReview} embedded paramPrefix="device" />
        </TabsContent>

        <TabsContent value="holidays">
          <AttendanceWorkspacePanel
            toolbar={
              showBranchContext ? (
                <AttendanceWorkspaceFilterToolbar
                  filters={<BranchSelector {...branchSelector} />}
                  actions={
                    <div className="flex flex-wrap gap-2">
                      <PhilippineHolidayImportDialog existingHolidays={data.holidays} />
                      <BranchHolidayDialog triggerLabel="Add holiday" />
                    </div>
                  }
                />
              ) : (
                <div className="flex flex-wrap justify-end gap-2">
                  <PhilippineHolidayImportDialog existingHolidays={data.holidays} />
                  <BranchHolidayDialog triggerLabel="Add holiday" />
                </div>
              )
            }
          >
            <AttendanceWorkspaceTableShell
              isEmpty={data.holidays.length === 0}
              emptyState={
                <EmptyState
                  title="No branch holidays configured"
                  description="Add calendar dates that affect attendance and payroll calculations."
                />
              }
            >
              <Table className="min-w-[760px] xl:min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Event type</TableHead>
                    <TableHead>Pay treatment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium text-foreground">
                        {formatDate(holiday.holidayDate)}
                      </TableCell>
                      <TableCell>{holiday.label}</TableCell>
                      <TableCell>
                        <StatusBadge tone="neutral" className={getBranchHolidayTypeBadgeClass(holiday)}>
                          {formatBranchHolidayKindLabel(holiday.holidayKind)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          tone="neutral"
                          className={getBranchHolidayPayTreatmentBadgeClass(holiday)}
                        >
                          {formatBranchHolidayPayTreatmentLabel(holiday.payTreatment)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="w-28 text-right">
                        <BranchHolidayRowActions holiday={holiday} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AttendanceWorkspaceTableShell>
          </AttendanceWorkspacePanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TimekeepingContextCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/15 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function resolveAllowedIpStatus(
  allowedIp: AttendanceAllowedIpSummary,
  currentDetectedIp: string | null,
) {
  if (currentDetectedIp && allowedIp.ipAddress === currentDetectedIp) {
    return { label: "Current", tone: "success" as const };
  }

  return { label: "Approved", tone: "neutral" as const };
}

function getBranchHolidayTypeBadgeClass(holiday: BranchHolidaySummary) {
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

function getBranchHolidayPayTreatmentBadgeClass(holiday: BranchHolidaySummary) {
  switch (holiday.payTreatment) {
    case "unpaid":
      return "border-transparent bg-slate-100 text-slate-700";
    case "paid_regular_day":
      return "border-transparent bg-emerald-100 text-emerald-800";
    case "custom":
      return "border-transparent bg-amber-100 text-amber-800";
  }
}
