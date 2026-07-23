import type { MergeVariableDefinition } from "@/components/document-engine/variables/types";

export const DEFAULT_MERGE_VARIABLES: MergeVariableDefinition[] = [
  { id: "customer.name", label: "Customer Name", group: "Customer", sampleValue: "Juan Dela Cruz" },
  { id: "customer.phone", label: "Customer Phone", group: "Customer", sampleValue: "09171234567" },
  { id: "customer.email", label: "Customer Email", group: "Customer", sampleValue: "customer@example.com" },
  { id: "customer.address", label: "Customer Address", group: "Customer", sampleValue: "Quezon City" },
  { id: "vehicle.make", label: "Vehicle Make", group: "Vehicle", sampleValue: "Toyota" },
  { id: "vehicle.model", label: "Vehicle Model", group: "Vehicle", sampleValue: "Vios" },
  { id: "vehicle.plateNumber", label: "Plate Number", group: "Vehicle", sampleValue: "ABC 1234" },
  { id: "vehicle.vin", label: "VIN", group: "Vehicle", sampleValue: "JTDBT923X12345678" },
  { id: "company.name", label: "Company Name", group: "Company", sampleValue: "SAY Auto Care Center" },
  { id: "company.address", label: "Company Address", group: "Company", sampleValue: "123 Main Street" },
  { id: "company.phone", label: "Company Phone", group: "Company", sampleValue: "09171234567" },
  { id: "company.email", label: "Company Email", group: "Company", sampleValue: "hello@shop.com" },
  { id: "company.vatNumber", label: "VAT Number", group: "Company", sampleValue: "123-456-789-000" },
];
