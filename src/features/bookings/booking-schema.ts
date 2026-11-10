export function isMissingScheduledBookingsTable(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "PGRST205" ||
    (message.includes("scheduled_bookings") &&
      (message.includes("does not exist") || message.includes("schema cache")))
  );
}

export const SCHEDULED_BOOKINGS_MIGRATION_HINT =
  "Bookings requires the scheduled_bookings table. Apply migration supabase/migrations/0078_scheduled_bookings.sql to your Supabase project, then refresh.";
