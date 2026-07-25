import { describe, expect, it } from "vitest";

import {
  buildAttendanceSummary,
  buildBranchHolidayFormValues,
  buildStaffScheduleFormValues,
  computeExpectedWorkdaySummary,
  evaluateMechanicAttendanceVerification,
  matchesAttendanceStatusFilter,
} from "@/features/attendance/utils";

describe("computeExpectedWorkdaySummary", () => {
  it("subtracts branch holidays and approved leave from scheduled workdays without double counting", () => {
    const result = computeExpectedWorkdaySummary({
      schedule: {
        id: "schedule-1",
        staffId: "staff-1",
        shiftStartTime: "08:00:00",
        shiftEndTime: "17:00:00",
        graceMinutes: 10,
        mondayIsWorkday: true,
        tuesdayIsWorkday: true,
        wednesdayIsWorkday: true,
        thursdayIsWorkday: true,
        fridayIsWorkday: true,
        saturdayIsWorkday: false,
        sundayIsWorkday: false,
        notes: null,
      },
      startDate: "2026-05-04",
      endDate: "2026-05-08",
      holidayDates: ["2026-05-05", "2026-05-08"],
      leaveEntries: [
        {
          startDate: "2026-05-06",
          endDate: "2026-05-07",
        },
        {
          startDate: "2026-05-08",
          endDate: "2026-05-08",
        },
      ],
    });

    expect(result.scheduledWorkdayCount).toBe(5);
    expect(result.holidayDayCount).toBe(2);
    expect(result.approvedLeaveDayCount).toBe(2);
    expect(result.expectedWorkdayCount).toBe(1);
  });
});

describe("buildStaffScheduleFormValues", () => {
  it("normalizes stored schedule times for the time input fields", () => {
    const result = buildStaffScheduleFormValues("staff-1", {
      id: "schedule-1",
      staffId: "staff-1",
      shiftStartTime: "07:00:00",
      shiftEndTime: "17:00:00",
      graceMinutes: 0,
      mondayIsWorkday: true,
      tuesdayIsWorkday: true,
      wednesdayIsWorkday: true,
      thursdayIsWorkday: true,
      fridayIsWorkday: true,
      saturdayIsWorkday: true,
      sundayIsWorkday: false,
      notes: null,
    });

    expect(result.shiftStartTime).toBe("07:00");
    expect(result.shiftEndTime).toBe("17:00");
  });
});

describe("buildBranchHolidayFormValues", () => {
  it("defaults new branch calendar dates to branch closure and unpaid", () => {
    const result = buildBranchHolidayFormValues(null);

    expect(result.holidayKind).toBe("branch_closure");
    expect(result.payTreatment).toBe("unpaid");
  });
});

describe("attendance holiday handling", () => {
  const branchHoliday = {
    id: "holiday-1",
    branchId: "branch-1",
    holidayDate: "2026-05-16",
    label: "Shop maintenance",
    holidayKind: "branch_closure" as const,
    payTreatment: "unpaid" as const,
    notes: "Closed for maintenance",
  };

  it("does not count no-record staff as unrecorded on a branch closure date", () => {
    const result = buildAttendanceSummary(
      [
        {
          staffId: "staff-1",
          fullName: "Jane Doe",
          role: "mechanic",
          contactNumber: null,
          schedule: null,
          leaveEntry: null,
          attendance: null,
          hasMissingTimeout: false,
          isApproved: false,
        },
        {
          staffId: "staff-2",
          fullName: "John Doe",
          role: "mechanic",
          contactNumber: null,
          schedule: null,
          leaveEntry: null,
          attendance: {
            id: "attendance-1",
            attendanceDate: "2026-05-16",
            timeIn: "2026-05-16T00:00:00.000Z",
            timeOut: null,
            status: "present",
            notes: null,
            approvedByStaffId: null,
            approvedAt: null,
          },
          hasMissingTimeout: true,
          isApproved: false,
        },
      ],
      {
        branchHoliday,
      },
    );

    expect(result.unrecordedCount).toBe(0);
    expect(result.recordedCount).toBe(1);
    expect(result.missingTimeoutCount).toBe(0);
  });

  it("does not treat closure-day rows as unrecorded or missing-timeout filters", () => {
    const noAttendanceItem = {
      staffId: "staff-1",
      fullName: "Jane Doe",
      role: "mechanic" as const,
      contactNumber: null,
      schedule: null,
      leaveEntry: null,
      attendance: null,
      hasMissingTimeout: false,
      isApproved: false,
    };
    const openShiftItem = {
      ...noAttendanceItem,
      staffId: "staff-2",
      fullName: "John Doe",
      attendance: {
        id: "attendance-1",
        attendanceDate: "2026-05-16",
        timeIn: "2026-05-16T00:00:00.000Z",
        timeOut: null,
        status: "present" as const,
        notes: null,
        approvedByStaffId: null,
        approvedAt: null,
      },
      hasMissingTimeout: true,
    };

    expect(
      matchesAttendanceStatusFilter(noAttendanceItem, "unrecorded", { branchHoliday }),
    ).toBe(false);
    expect(
      matchesAttendanceStatusFilter(openShiftItem, "missing_timeout", { branchHoliday }),
    ).toBe(false);
  });

  it("matches recorded, schedule-configured, and absent/unrecorded summary filters", () => {
    const scheduledUnrecorded = {
      staffId: "staff-1",
      fullName: "Jane Doe",
      role: "mechanic" as const,
      contactNumber: null,
      schedule: {
        id: "schedule-1",
        staffId: "staff-1",
        shiftStartTime: "09:00:00",
        shiftEndTime: "18:00:00",
        graceMinutes: 10,
        mondayIsWorkday: true,
        tuesdayIsWorkday: true,
        wednesdayIsWorkday: true,
        thursdayIsWorkday: true,
        fridayIsWorkday: true,
        saturdayIsWorkday: false,
        sundayIsWorkday: false,
        notes: null,
      },
      leaveEntry: null,
      attendance: null,
      hasMissingTimeout: false,
      isApproved: false,
    };
    const recordedPresent = {
      ...scheduledUnrecorded,
      staffId: "staff-2",
      fullName: "John Doe",
      attendance: {
        id: "attendance-1",
        attendanceDate: "2026-05-16",
        timeIn: "2026-05-16T00:00:00.000Z",
        timeOut: "2026-05-16T09:00:00.000Z",
        status: "present" as const,
        notes: null,
        approvedByStaffId: null,
        approvedAt: null,
      },
    };
    const recordedAbsent = {
      ...scheduledUnrecorded,
      staffId: "staff-3",
      fullName: "Alex Doe",
      schedule: null,
      attendance: {
        id: "attendance-2",
        attendanceDate: "2026-05-16",
        timeIn: null,
        timeOut: null,
        status: "absent" as const,
        notes: null,
        approvedByStaffId: null,
        approvedAt: null,
      },
    };

    expect(matchesAttendanceStatusFilter(recordedPresent, "recorded")).toBe(true);
    expect(matchesAttendanceStatusFilter(scheduledUnrecorded, "recorded")).toBe(false);
    expect(matchesAttendanceStatusFilter(scheduledUnrecorded, "schedule_configured")).toBe(true);
    expect(matchesAttendanceStatusFilter(recordedAbsent, "schedule_configured")).toBe(false);
    expect(matchesAttendanceStatusFilter(recordedAbsent, "absent_unrecorded")).toBe(true);
    expect(matchesAttendanceStatusFilter(scheduledUnrecorded, "absent_unrecorded")).toBe(true);
    expect(matchesAttendanceStatusFilter(recordedPresent, "absent_unrecorded")).toBe(false);
    expect(
      matchesAttendanceStatusFilter(scheduledUnrecorded, "absent_unrecorded", { branchHoliday }),
    ).toBe(false);
  });
});

describe("evaluateMechanicAttendanceVerification", () => {
  const baseSettings = {
    requireShopIpForMechanicAttendance: true,
    requireShopLocationForMechanicAttendance: true,
    allowDtrAmendments: true,
    allowAttendanceAdminOverride: false,
    geofence: {
      latitude: 14.6,
      longitude: 121.0,
      radiusMeters: 100,
    },
  };

  it("requires any 2 of 3 checks when all guards are enabled", () => {
    expect(
      evaluateMechanicAttendanceVerification({
        settings: baseSettings,
        ipStatus: {
          requestIp: "1.1.1.1",
          isShopIpRequired: true,
          isAllowed: true,
          matchedAllowedIp: null,
        },
        locationStatus: {
          isLocationRequired: true,
          isAllowed: true,
          latitude: 14.6,
          longitude: 121.0,
          accuracyMeters: 10,
          distanceMeters: 5,
          errorMessage: null,
        },
        deviceStatus: {
          status: "pending",
          isApproved: false,
        },
      }).isAllowed,
    ).toBe(true);

    expect(
      evaluateMechanicAttendanceVerification({
        settings: baseSettings,
        ipStatus: {
          requestIp: "1.1.1.1",
          isShopIpRequired: true,
          isAllowed: false,
          matchedAllowedIp: null,
        },
        locationStatus: {
          isLocationRequired: true,
          isAllowed: false,
          latitude: null,
          longitude: null,
          accuracyMeters: null,
          distanceMeters: null,
          errorMessage: "Outside shop area",
        },
        deviceStatus: {
          status: "approved",
          isApproved: true,
        },
      }).isAllowed,
    ).toBe(false);
  });

  it("requires both checks when only two guards are active", () => {
    expect(
      evaluateMechanicAttendanceVerification({
        settings: {
          ...baseSettings,
          requireShopLocationForMechanicAttendance: false,
        },
        ipStatus: {
          requestIp: "1.1.1.1",
          isShopIpRequired: true,
          isAllowed: true,
          matchedAllowedIp: null,
        },
        locationStatus: {
          isLocationRequired: false,
          isAllowed: false,
          latitude: null,
          longitude: null,
          accuracyMeters: null,
          distanceMeters: null,
          errorMessage: null,
        },
        deviceStatus: {
          status: "approved",
          isApproved: true,
        },
      }).isAllowed,
    ).toBe(true);

    expect(
      evaluateMechanicAttendanceVerification({
        settings: {
          ...baseSettings,
          requireShopLocationForMechanicAttendance: false,
        },
        ipStatus: {
          requestIp: "1.1.1.1",
          isShopIpRequired: true,
          isAllowed: false,
          matchedAllowedIp: null,
        },
        locationStatus: {
          isLocationRequired: false,
          isAllowed: false,
          latitude: null,
          longitude: null,
          accuracyMeters: null,
          distanceMeters: null,
          errorMessage: null,
        },
        deviceStatus: {
          status: "pending",
          isApproved: false,
        },
      }).isAllowed,
    ).toBe(false);
  });

  it("always blocks devices registered to another mechanic", () => {
    expect(
      evaluateMechanicAttendanceVerification({
        settings: baseSettings,
        ipStatus: {
          requestIp: "1.1.1.1",
          isShopIpRequired: true,
          isAllowed: true,
          matchedAllowedIp: null,
        },
        locationStatus: {
          isLocationRequired: true,
          isAllowed: true,
          latitude: 14.6,
          longitude: 121.0,
          accuracyMeters: 10,
          distanceMeters: 5,
          errorMessage: null,
        },
        deviceStatus: {
          status: "registered_to_other_staff",
          isApproved: false,
        },
      }),
    ).toMatchObject({
      isAllowed: false,
      registeredToOtherStaff: true,
    });
  });
});
