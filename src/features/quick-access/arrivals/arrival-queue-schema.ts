export function isMissingDailyArrivalsTable(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  const message = (error.message ?? "").toLowerCase();

  return (
    error.code === "PGRST205" ||
    (message.includes("daily_arrivals") &&
      (message.includes("schema cache") || message.includes("does not exist")))
  );
}

export const DAILY_ARRIVALS_SETUP_MESSAGE =
  "Today's Arrivals requires the daily_arrivals database table. Apply migration supabase/migrations/0070_daily_arrivals.sql to your Supabase project, then reload the schema cache (or wait a minute) and refresh this page.";
