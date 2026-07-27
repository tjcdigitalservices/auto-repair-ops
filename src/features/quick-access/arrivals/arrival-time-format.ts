import { DateTime } from "luxon";

export function formatArrivalRelativeTime(iso: string) {
  const dt = DateTime.fromISO(iso);

  if (!dt.isValid) {
    return "Unknown";
  }

  return dt.toRelative({ style: "short" }) ?? dt.toLocaleString(DateTime.DATETIME_MED);
}

export function formatArrivalAbsoluteTime(iso: string) {
  const dt = DateTime.fromISO(iso);

  if (!dt.isValid) {
    return iso;
  }

  return dt.toLocaleString(DateTime.DATETIME_MED);
}

export function formatArrivalClockTime(iso: string) {
  const dt = DateTime.fromISO(iso);

  if (!dt.isValid) {
    return "—";
  }

  return dt.toLocaleString(DateTime.TIME_SIMPLE);
}
