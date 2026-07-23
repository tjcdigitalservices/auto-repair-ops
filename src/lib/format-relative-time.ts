const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

export function formatRelativeTime(value: string | Date, { addSuffix = false }: { addSuffix?: boolean } = {}) {
  const date = value instanceof Date ? value : new Date(value);
  const elapsedSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteElapsedSeconds = Math.abs(elapsedSeconds);

  for (const [unit, secondsInUnit] of TIME_UNITS) {
    if (absoluteElapsedSeconds >= secondsInUnit || unit === "second") {
      const quantity = Math.round(elapsedSeconds / secondsInUnit);
      const formatted = RELATIVE_TIME_FORMATTER.format(quantity, unit);
      return addSuffix && quantity <= 0 ? formatted.replace(/^in /, "") : formatted;
    }
  }

  return "just now";
}
