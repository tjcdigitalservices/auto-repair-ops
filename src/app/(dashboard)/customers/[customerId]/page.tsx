import { notFound } from "next/navigation";

import { CustomerDetailPageContent } from "@/features/customers/components/customer-detail-page-content";
import { getCustomerById } from "@/features/customers/queries/customer-queries";
import { listServiceHistoryByVehicleIds } from "@/features/service-history/queries/service-history-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type CustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await requireAuthenticatedStaff();
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);

  if (!customer) {
    notFound();
  }

  const canViewServiceHistory = session.capabilities.includes("job_orders:read");
  const serviceHistory = canViewServiceHistory
    ? await listServiceHistoryByVehicleIds(customer.vehicles.map((vehicle) => vehicle.id))
    : [];

  return (
    <CustomerDetailPageContent
      customer={customer}
      serviceHistory={serviceHistory}
      canViewServiceHistory={canViewServiceHistory}
    />
  );
}
