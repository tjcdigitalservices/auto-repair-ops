export const SERVICE_IMPORT_HEADERS = [
  "Service Name",
  "Category",
  "Description",
  "Labor Price",
  "Duration (minutes)",
  "Status",
] as const;

export const SERVICE_IMPORT_SAMPLE_ROW = [
  "Oil Change",
  "Maintenance",
  "Standard oil and filter change",
  "850",
  "45",
  "active",
] as const;

export const SERVICE_IMPORT_HEADER_ALIASES: Record<string, string> = {
  "service name": "name",
  name: "name",
  service: "name",
  category: "category",
  description: "description",
  "labor price": "laborPrice",
  price: "laborPrice",
  labor_price: "laborPrice",
  "duration (minutes)": "estimatedDurationMinutes",
  duration: "estimatedDurationMinutes",
  "duration minutes": "estimatedDurationMinutes",
  minutes: "estimatedDurationMinutes",
  status: "status",
};

export function buildServiceImportTemplateCsv() {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replaceAll('"', '""')}"`;
    }

    return value;
  };

  return `${SERVICE_IMPORT_HEADERS.map(escape).join(",")}\n${SERVICE_IMPORT_SAMPLE_ROW.map(escape).join(",")}\n`;
}
