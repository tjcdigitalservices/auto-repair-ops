"use server";

import { revalidatePath } from "next/cache";
import { DateTime } from "luxon";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import type { ArrivalSource } from "@/features/quick-access/arrivals/arrival-queue-types";

const QUICK_ACCESS_PATH = "/quick-access";

function todayQueueDate() {
  return DateTime.local().toISODate() ?? new Date().toISOString().slice(0, 10);
}

export async function addDailyArrivalAction(input: {
  customerId: string;
  vehicleId: string;
  arrivalSource: ArrivalSource;
}) {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("vehicles:write");
  const branchId = branchScope.writeBranchId;
  const queueDate = todayQueueDate();
  const now = new Date().toISOString();

  const { data: vehicle, error: vehicleError } = await applyBranchFilter(
    supabase.from("vehicles").select("id, customer_id").eq("id", input.vehicleId),
    branchId,
  ).maybeSingle();

  if (vehicleError) {
    return { ok: false as const, message: vehicleError.message };
  }

  if (!vehicle || vehicle.customer_id !== input.customerId) {
    return { ok: false as const, message: "Vehicle not found for this customer." };
  }

  const { data: existing } = await supabase
    .from("daily_arrivals")
    .select("id")
    .eq("branch_id", branchId)
    .eq("vehicle_id", input.vehicleId)
    .eq("queue_date", queueDate)
    .maybeSingle();

  if (existing) {
    const { error: touchError } = await supabase
      .from("daily_arrivals")
      .update({ last_activity_at: now })
      .eq("id", existing.id);

    if (touchError) {
      return { ok: false as const, message: touchError.message };
    }

    revalidatePath(QUICK_ACCESS_PATH);
    return { ok: true as const, arrivalId: existing.id, created: false };
  }

  const { data, error } = await supabase
    .from("daily_arrivals")
    .insert({
      tenant_id: context.tenantId,
      branch_id: branchId,
      customer_id: input.customerId,
      vehicle_id: input.vehicleId,
      queue_date: queueDate,
      arrived_at: now,
      last_activity_at: now,
      arrival_source: input.arrivalSource,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath(QUICK_ACCESS_PATH);
  return { ok: true as const, arrivalId: data.id, created: true };
}

export async function markDailyArrivalIntakeStartedAction(vehicleId: string) {
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:write");
  const branchId = branchScope.writeBranchId;
  const queueDate = todayQueueDate();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("daily_arrivals")
    .update({
      intake_started_at: now,
      last_activity_at: now,
    })
    .eq("branch_id", branchId)
    .eq("vehicle_id", vehicleId)
    .eq("queue_date", queueDate)
    .is("intake_started_at", null);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  await supabase
    .from("daily_arrivals")
    .update({ last_activity_at: now })
    .eq("branch_id", branchId)
    .eq("vehicle_id", vehicleId)
    .eq("queue_date", queueDate);

  revalidatePath(QUICK_ACCESS_PATH);
  return { ok: true as const };
}

export async function touchDailyArrivalActivityAction(vehicleId: string) {
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:read");
  const branchId = branchScope.selectedBranchId ?? branchScope.writeBranchId;
  const queueDate = todayQueueDate();
  const now = new Date().toISOString();

  await supabase
    .from("daily_arrivals")
    .update({ last_activity_at: now })
    .eq("branch_id", branchId)
    .eq("vehicle_id", vehicleId)
    .eq("queue_date", queueDate);

  revalidatePath(QUICK_ACCESS_PATH);
  return { ok: true as const };
}
