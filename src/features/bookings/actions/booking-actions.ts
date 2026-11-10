"use server";

import { revalidatePath } from "next/cache";

import type { BookingStatus } from "@/features/bookings/types";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";

export async function confirmBookingAction(bookingId: string) {
  const { supabase } = await getAuthorizedSupabaseServerClient("bookings:write");

  const { error } = await supabase.rpc("staff_confirm_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/bookings");
  return { ok: true as const };
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: Extract<BookingStatus, "cancelled" | "no_show">,
) {
  const { supabase } = await getAuthorizedSupabaseServerClient("bookings:write");

  const { error } = await supabase.rpc("staff_update_booking_status", {
    p_booking_id: bookingId,
    p_status: status,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/bookings");
  return { ok: true as const };
}

export async function checkInBookingAction(bookingId: string) {
  const { supabase } = await getAuthorizedSupabaseServerClient("bookings:write");

  const { error } = await supabase.rpc("check_in_scheduled_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/bookings");
  revalidatePath("/quick-access");
  return { ok: true as const };
}
