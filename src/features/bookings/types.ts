export type BookingStatus =
  | "requested"
  | "confirmed"
  | "checked_in"
  | "cancelled"
  | "no_show";

export type BookingServiceKind = "checkup" | "repair" | "other";

export type BookingListItem = {
  id: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  serviceKind: BookingServiceKind;
  customerConcern: string;
  status: BookingStatus;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleLabel: string;
  createdBy: "customer" | "staff";
};

export type BookingStoreHoursDay = {
  day: string;
  hours: string;
};

export type BookingCalendarHoliday = {
  holidayDate: string;
  label: string;
  holidayKind: string;
};

export type BookingCalendarDaySummary = {
  date: string;
  bookingCount: number;
  activeBookingCount: number;
  isClosed: boolean;
  closedReason: "holiday" | "weekly" | null;
  holiday: BookingCalendarHoliday | null;
  storeHoursLabel: string | null;
  bookings: BookingListItem[];
};

export type BookingsCalendarData = {
  monthStartDate: string;
  monthEndDate: string;
  monthLabel: string;
  selectedDate: string;
  today: string;
  storeHours: BookingStoreHoursDay[];
  days: BookingCalendarDaySummary[];
  upcoming: BookingListItem[];
};
