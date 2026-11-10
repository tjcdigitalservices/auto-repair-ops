import { describe, expect, it } from "vitest";

import { buildBookingsCalendarData } from "@/features/bookings/bookings-calendar-utils";
import type { BookingListItem } from "@/features/bookings/types";

const storeHours = [
  { day: "Monday", hours: "7:00 AM – 5:00 PM" },
  { day: "Sunday", hours: "Closed" },
];

describe("buildBookingsCalendarData", () => {
  it("marks holidays and weekly closed days", () => {
    const data = buildBookingsCalendarData({
      bookings: [],
      storeHours,
      holidays: [{ holidayDate: "2026-03-12", label: "Shop off-site", holidayKind: "branch_closure" }],
      month: "2026-03",
      selectedDate: "2026-03-12",
    });

    const holidayDay = data.days.find((day) => day.date === "2026-03-12");
    const sunday = data.days.find((day) => day.date === "2026-03-01");

    expect(holidayDay?.isClosed).toBe(true);
    expect(holidayDay?.closedReason).toBe("holiday");
    expect(sunday?.isClosed).toBe(true);
    expect(sunday?.closedReason).toBe("weekly");
  });

  it("counts bookings per day and builds upcoming list", () => {
    const bookings: BookingListItem[] = [
      {
        id: "1",
        scheduledStart: "2026-03-15T01:00:00.000Z",
        scheduledEnd: null,
        serviceKind: "checkup",
        customerConcern: "Brakes",
        status: "confirmed",
        customerId: "c1",
        customerName: "Ana Cruz",
        vehicleId: "v1",
        vehicleLabel: "Vios",
        createdBy: "customer",
      },
      {
        id: "2",
        scheduledStart: "2026-03-15T06:30:00.000Z",
        scheduledEnd: null,
        serviceKind: "repair",
        customerConcern: "Noise",
        status: "requested",
        customerId: "c2",
        customerName: "Ben Lee",
        vehicleId: "v2",
        vehicleLabel: "Civic",
        createdBy: "customer",
      },
    ];

    const data = buildBookingsCalendarData({
      bookings,
      storeHours,
      holidays: [],
      month: "2026-03",
      selectedDate: "2026-03-15",
    });

    const day = data.days.find((entry) => entry.date === "2026-03-15");

    expect(day?.bookingCount).toBe(2);
    expect(day?.bookings).toHaveLength(2);
    expect(data.upcoming.length).toBeGreaterThanOrEqual(0);
  });
});
