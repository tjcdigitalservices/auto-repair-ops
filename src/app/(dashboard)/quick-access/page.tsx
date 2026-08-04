import { redirect } from "next/navigation";

import { QuickAccessPageClient } from "@/features/quick-access/components/quick-access-page-client";
import { getQuickAccessSearchState } from "@/features/quick-access/queries/quick-access-queries";

export const dynamic = "force-dynamic";

type QuickAccessRouteProps = {
  searchParams: Promise<{
    q?: string;
    plate?: string;
    lastName?: string;
    customerId?: string;
    vehicleId?: string;
  }>;
};

function hasQuickAccessLookupParams(params: {
  q?: string;
  plate?: string;
  lastName?: string;
  customerId?: string;
  vehicleId?: string;
}) {
  return Boolean(
    params.q?.trim() ||
      params.plate?.trim() ||
      params.lastName?.trim() ||
      (params.customerId?.trim() && params.vehicleId?.trim()),
  );
}

export default async function QuickAccessRoute({
  searchParams,
}: QuickAccessRouteProps) {
  const params = await searchParams;
  const { q, plate, lastName, customerId, vehicleId } = params;

  if (!hasQuickAccessLookupParams(params)) {
    redirect("/dashboard");
  }

  const searchState = await getQuickAccessSearchState({
    query: q,
    plate,
    lastName,
    customerId,
    vehicleId,
  });

  return <QuickAccessPageClient searchState={searchState} />;
}
