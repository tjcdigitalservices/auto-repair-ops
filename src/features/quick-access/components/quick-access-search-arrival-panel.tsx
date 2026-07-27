"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { addDailyArrivalAction } from "@/features/quick-access/arrivals/arrival-queue-actions";
import { findArrivalForVehicle } from "@/features/quick-access/arrivals/arrival-queue-utils";
import type { ArrivalQueueItem } from "@/features/quick-access/arrivals/arrival-queue-types";
import { buildQuickAccessIntakeHref } from "@/features/quick-access/intake/active-intake-session";
import type { QuickAccessCustomerRecord } from "@/features/quick-access/types";

export function QuickAccessSearchArrivalPanel({
  records,
  arrivals,
  plateQuery,
  autoAddSource,
}: {
  records: QuickAccessCustomerRecord[];
  arrivals: ArrivalQueueItem[];
  plateQuery: string;
  autoAddSource?: "plate_scanner" | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const record = records[0];
  const vehicle =
    record?.vehicles.find((item) => item.id === record.highlightedVehicleId) ??
    record?.vehicles[0] ??
    null;
  const existing = vehicle ? findArrivalForVehicle(arrivals, vehicle.id) : null;

  useEffect(() => {
    if (!autoAddSource || !record || !vehicle || existing) {
      return;
    }

    startTransition(async () => {
      await addDailyArrivalAction({
        customerId: record.customer.id,
        vehicleId: vehicle.id,
        arrivalSource: autoAddSource,
      });
      router.refresh();
    });
  }, [autoAddSource, existing, record, router, vehicle]);

  if (!record || !vehicle) {
    return null;
  }

  if (existing) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm">
        <p className="font-medium text-foreground">Already in Today&apos;s Arrivals</p>
        <p className="mt-1 text-muted-foreground">
          {existing.plateNumber || plateQuery} is on the queue with status {existing.queueStatusLabel}.
        </p>
        <Button asChild type="button" variant="ghost" className="mt-2 h-auto px-0">
          <a href={`#arrival-${vehicle.id}`}>View arrival card</a>
        </Button>
      </div>
    );
  }

  function addToQueue(startIntake: boolean) {
    startTransition(async () => {
      const result = await addDailyArrivalAction({
        customerId: record.customer.id,
        vehicleId: vehicle.id,
        arrivalSource: autoAddSource ?? "quick_search",
      });

      if (!result.ok) {
        return;
      }

      if (startIntake) {
        router.push(buildQuickAccessIntakeHref(record.customer.id, vehicle.id));
        return;
      }

      router.push(`/quick-access?focusVehicleId=${encodeURIComponent(vehicle.id)}`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
      <p className="text-sm font-medium text-foreground">Add this vehicle to Today&apos;s Arrivals?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {vehicle.make} {vehicle.model} · {record.customer.displayName}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => addToQueue(false)}>
          Add to Today&apos;s Arrivals
        </Button>
        <Button type="button" variant="bluePrimary" disabled={isPending} onClick={() => addToQueue(true)}>
          Start Intake Now
        </Button>
      </div>
    </div>
  );
}
