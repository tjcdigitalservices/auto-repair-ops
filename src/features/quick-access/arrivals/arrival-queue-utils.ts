import type { ArrivalQueueItem } from "@/features/quick-access/arrivals/arrival-queue-types";

export function findArrivalForVehicle(items: ArrivalQueueItem[], vehicleId: string) {
  return items.find((item) => item.vehicleId === vehicleId) ?? null;
}
