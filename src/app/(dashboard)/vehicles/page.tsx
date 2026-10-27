import { VehiclesPageView } from "@/features/vehicles/components/vehicles-page-view";
import { listCustomerOptions } from "@/features/customers/queries/customer-queries";
import { listVehicles } from "@/features/vehicles/queries/vehicle-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type VehiclesPageProps = {
  searchParams: Promise<{
    search?: string;
    customerId?: string;
    page?: string;
    error?: string;
  }>;
};

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const { search = "", customerId, page, error } = await searchParams;
  const [vehicles, customerOptions, session] = await Promise.all([
    listVehicles({ search, customerId }),
    listCustomerOptions(),
    requireAuthenticatedStaff(),
  ]);
  const canManageVehicles = session.capabilities.includes("vehicles:write");

  return (
    <VehiclesPageView
      vehicles={vehicles}
      search={search}
      customerId={customerId}
      customerOptions={customerOptions}
      page={page}
      error={error}
      canManageVehicles={canManageVehicles}
    />
  );
}
