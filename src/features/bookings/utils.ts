import type { BookingServiceKind, BookingStatus } from "@/features/bookings/types";

type BookingStatusTone = "default" | "success" | "warning" | "destructive" | "info" | "neutral";

export function getBookingStatusLabel(status: BookingStatus) {
  switch (status) {
    case "requested":
      return "Requested";
    case "confirmed":
      return "Confirmed";
    case "checked_in":
      return "Checked in";
    case "cancelled":
      return "Cancelled";
    case "no_show":
      return "No-show";
    default:
      return status;
  }
}

export function getBookingStatusTone(status: BookingStatus): BookingStatusTone {
  switch (status) {
    case "requested":
      return "warning";
    case "confirmed":
      return "info";
    case "checked_in":
      return "success";
    case "cancelled":
      return "neutral";
    case "no_show":
      return "destructive";
    default:
      return "neutral";
  }
}

export function getBookingServiceKindLabel(kind: BookingServiceKind) {
  switch (kind) {
    case "checkup":
      return "Checkup";
    case "repair":
      return "Repair";
    case "other":
      return "Other";
    default:
      return kind;
  }
}
