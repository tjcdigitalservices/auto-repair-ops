import { QuickAccessPageClient } from "@/features/quick-access/components/quick-access-page-client";
import { listTodayArrivalQueue } from "@/features/quick-access/arrivals/arrival-queue-queries";
import { getQuickAccessSearchState } from "@/features/quick-access/queries/quick-access-queries";

export const dynamic = "force-dynamic";

type QuickAccessRouteProps = {
  searchParams: Promise<{
    q?: string;
    plate?: string;
    lastName?: string;
    customerId?: string;
    vehicleId?: string;
    finished?: string;
    view?: string;
    focusVehicleId?: string;
    arrivalSource?: string;
    addArrival?: string;
  }>;
};

export default async function QuickAccessRoute({
  searchParams,
}: QuickAccessRouteProps) {
  const params = await searchParams;
  const { q, plate, lastName, customerId, vehicleId, finished, view, focusVehicleId, arrivalSource } =
    params;

  const [searchState, arrivalQueue] = await Promise.all([
    getQuickAccessSearchState({
      query: q,
      plate,
      lastName,
      customerId,
      vehicleId,
    }),
    listTodayArrivalQueue(),
  ]);

  return (
    <QuickAccessPageClient
      searchState={searchState}
      arrivals={arrivalQueue.items}
      finished={finished === "1"}
      showQueueView={view === "queue" || finished === "1"}
      focusVehicleId={focusVehicleId ?? null}
      arrivalSourceFromScan={arrivalSource === "plate_scanner"}
    />
  );
}
