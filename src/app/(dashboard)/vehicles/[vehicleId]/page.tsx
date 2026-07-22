import { notFound } from "next/navigation";

import { VehicleDetailPageContent } from "@/features/vehicles/components/vehicle-detail-page-content";
import {
  getVehicleById,
  listDocumentHistoryByVehicleId,
} from "@/features/vehicles/queries/vehicle-queries";
import { listServiceHistoryByVehicleIds } from "@/features/service-history/queries/service-history-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type VehicleDetailPageProps = {
  params: Promise<{
    vehicleId: string;
  }>;
  searchParams: Promise<{
    historicalSaved?: string;
    tab?: string;
  }>;
};

export default async function VehicleDetailPage({ params, searchParams }: VehicleDetailPageProps) {
  const session = await requireAuthenticatedStaff();
  const { vehicleId } = await params;
  const { historicalSaved } = await searchParams;
  const vehicle = await getVehicleById(vehicleId);

  if (!vehicle) {
    notFound();
  }

  const canManageVehicles = session.capabilities.includes("vehicles:write");
  const canRecordPastService = session.capabilities.includes("job_orders:write");
  const canViewServiceHistory = session.capabilities.includes("job_orders:read");
  const [serviceHistory, documents] = await Promise.all([
    canViewServiceHistory ? listServiceHistoryByVehicleIds([vehicle.id]) : Promise.resolve([]),
    listDocumentHistoryByVehicleId(vehicle.id),
  ]);

  return (
    <VehicleDetailPageContent
      vehicle={vehicle}
      serviceHistory={serviceHistory}
      documents={documents}
      canViewServiceHistory={canViewServiceHistory}
      canManageVehicles={canManageVehicles}
      canRecordPastService={canRecordPastService}
      historicalSaved={historicalSaved === "1"}
    />
  );
}
