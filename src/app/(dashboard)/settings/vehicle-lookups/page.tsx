import { AppLink } from "@/components/shared/app-link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { VehicleLookupsPageContent } from "@/features/vehicles/components/vehicle-lookups-page-content";
import { getVehicleLookupPageData } from "@/features/vehicles/queries/vehicle-lookup-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function VehicleLookupsPage() {
  await requireStaffCapability("settings:read");
  const data = await getVehicleLookupPageData();

  return (
    <div className="space-y-0">
      <PageHeader
        title="Vehicle lookups"
        description="Internal make, model, and dropdown reference data for vehicle registration."
        actions={
          <Button asChild variant="outline">
            <AppLink href="/settings">
              Back to settings
            </AppLink>
          </Button>
        }
      />
      <VehicleLookupsPageContent data={data} />
    </div>
  );
}
