import {
  EntityDetailField,
  EntityDetailLink,
  EntityDetailSection,
} from "@/components/shared/entity-detail";
import type { CustomerDetail } from "@/features/customers/types";

export function CustomerDetailSidebar({ customer }: { customer: CustomerDetail }) {
  const mapsHref = customer.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`
    : null;

  return (
    <>
      {customer.companyName ? (
        <EntityDetailSection title="Customer overview">
          <EntityDetailField label="Company">{customer.companyName}</EntityDetailField>
        </EntityDetailSection>
      ) : null}

      <EntityDetailSection title="Contact">
        <div className="space-y-4">
          <EntityDetailField label="Contact number">{customer.contactNumber}</EntityDetailField>
          <EntityDetailField label="Email">{customer.email}</EntityDetailField>
        </div>
      </EntityDetailSection>

      <EntityDetailSection title="Address">
        <EntityDetailField label="Address">
          {customer.address ? (
            <div className="space-y-2">
              <p className="whitespace-pre-wrap">{customer.address}</p>
              {mapsHref ? (
                <EntityDetailLink
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm"
                >
                  View on map
                </EntityDetailLink>
              ) : null}
            </div>
          ) : null}
        </EntityDetailField>
      </EntityDetailSection>

      <EntityDetailSection title="Notes">
        <EntityDetailField label="Notes">
          {customer.notes?.trim() ? (
            <p className="whitespace-pre-wrap font-normal leading-6">{customer.notes.trim()}</p>
          ) : null}
        </EntityDetailField>
      </EntityDetailSection>
    </>
  );
}
