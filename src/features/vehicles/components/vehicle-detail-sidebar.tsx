import {
  EntityDetailField,
  EntityDetailLink,
  EntityDetailSection,
} from "@/components/shared/entity-detail";
import type { VehicleDetail } from "@/features/vehicles/types";

export function VehicleDetailSidebar({ vehicle }: { vehicle: VehicleDetail }) {
  return (
    <>
      <EntityDetailSection title="Customer">
        <EntityDetailField label="Linked customer">
          <EntityDetailLink href={`/customers/${vehicle.customerId}`}>
            {vehicle.customerName}
          </EntityDetailLink>
        </EntityDetailField>
      </EntityDetailSection>

      <EntityDetailSection title="Identification">
        <div className="space-y-4">
          <EntityDetailField label="VIN">{vehicle.vin}</EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Specifications">
        <div className="space-y-4">
          <EntityDetailField label="Year">{vehicle.year}</EntityDetailField>
          <EntityDetailField label="Transmission">{vehicle.transmission}</EntityDetailField>
          <EntityDetailField label="Fuel type">{vehicle.fuelType}</EntityDetailField>
          <EntityDetailField label="Engine">{vehicle.engineSize}</EntityDetailField>
          <EntityDetailField label="Variant">{vehicle.variant}</EntityDetailField>
          <EntityDetailField label="Color">{vehicle.color}</EntityDetailField>
          <EntityDetailField label="Mileage">
            {vehicle.mileage !== null ? `${vehicle.mileage.toLocaleString()} km` : null}
          </EntityDetailField>
        </div>
      </EntityDetailSection>
    </>
  );
}
