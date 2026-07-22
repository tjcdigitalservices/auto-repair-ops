export const STORE_HOUR_DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type StoreHourDayName = (typeof STORE_HOUR_DAY_NAMES)[number];

export function storeHourFieldName(day: StoreHourDayName) {
  return `storeHours${day}`;
}

export function mapStoreHoursToFormValues(
  storeHours: Array<{ day: string; hours: string }>,
): Record<string, string> {
  const byDay = new Map(storeHours.map((entry) => [entry.day, entry.hours]));

  return Object.fromEntries(
    STORE_HOUR_DAY_NAMES.map((day) => [
      storeHourFieldName(day),
      byDay.get(day) ?? "",
    ]),
  );
}
