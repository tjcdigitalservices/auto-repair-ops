import {
  EntityDetailField,
  EntityDetailLink,
  EntityDetailSection,
} from "@/components/shared/entity-detail";
import type { QuotationDetail } from "@/features/quotations/types";
import { formatCurrency } from "@/lib/currency";

export function QuotationDetailSidebar({ quotation }: { quotation: QuotationDetail }) {
  const vehicleModelYear =
    quotation.vehicleMake && quotation.vehicleModel
      ? `${quotation.vehicleMake} ${quotation.vehicleModel}${
          quotation.vehicleYear ? ` (${quotation.vehicleYear})` : ""
        }`
      : quotation.vehicleLabel;

  return (
    <>
      <EntityDetailSection title="Customer">
        <div className="space-y-4">
          <EntityDetailField label="Customer">
            <EntityDetailLink href={`/customers/${quotation.customerId}`}>
              {quotation.customerName}
            </EntityDetailLink>
          </EntityDetailField>
          <EntityDetailField label="Contact number">
            {quotation.customerContactNumber}
          </EntityDetailField>
          <EntityDetailField label="Address">{quotation.customerAddress}</EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Vehicle">
        <div className="space-y-4">
          <EntityDetailField label="Vehicle">
            <EntityDetailLink href={`/vehicles/${quotation.vehicleId}`}>
              {vehicleModelYear}
            </EntityDetailLink>
          </EntityDetailField>
          <EntityDetailField label="Plate number">{quotation.vehiclePlateNumber}</EntityDetailField>
          <EntityDetailField label="VIN">{quotation.vehicleVin}</EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Scope">
        <div className="space-y-4">
          <EntityDetailField label="Nature of repair">
            {quotation.natureOfRepair?.trim() ? (
              <p className="whitespace-pre-wrap font-normal leading-6">
                {quotation.natureOfRepair.trim()}
              </p>
            ) : null}
          </EntityDetailField>
          <EntityDetailField label="Inspection notes">
            {quotation.inspectionNotes?.trim() ? (
              <p className="whitespace-pre-wrap font-normal leading-6">
                {quotation.inspectionNotes.trim()}
              </p>
            ) : null}
          </EntityDetailField>
          <EntityDetailField label="Prepared by">
            {quotation.preparedByName
              ? quotation.preparedByTitle
                ? `${quotation.preparedByName} · ${quotation.preparedByTitle}`
                : quotation.preparedByName
              : null}
          </EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Totals">
        <div className="space-y-4">
          <EntityDetailField label="Subtotal">{formatCurrency(quotation.subtotal)}</EntityDetailField>
          <EntityDetailField label="Discount">{formatCurrency(quotation.discount)}</EntityDetailField>
          <EntityDetailField label="Tax">{formatCurrency(quotation.tax)}</EntityDetailField>
          <EntityDetailField label="Total estimate">
            {formatCurrency(quotation.totalAmount)}
          </EntityDetailField>
        </div>
      </EntityDetailSection>
    </>
  );
}
