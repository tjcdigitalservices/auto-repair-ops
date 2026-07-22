import type { ServiceInlineCreateResult } from "@/features/services/types";
import type { QuotationServiceOption } from "@/features/quotations/types";

export type ServicePickerOption = QuotationServiceOption;

export function mapInlineCreateResultToServicePickerOption(
  service: ServiceInlineCreateResult,
): ServicePickerOption {
  return {
    id: service.id,
    label: service.label,
    category: service.category,
    unitPrice: service.unitPrice,
  };
}

export function filterServicePickerOptions(
  services: ServicePickerOption[],
  query: string,
  selectedServiceId?: string,
) {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return services;
  }

  return services.filter((service) => {
    if (selectedServiceId && service.id === selectedServiceId) {
      return true;
    }

    return [service.label, service.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}
