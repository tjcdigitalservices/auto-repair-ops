export const SUPPLIER_IMPORT_HEADERS = [
  "Supplier Name",
  "Contact Person",
  "Contact Number",
  "Email",
  "Address",
  "Payment Terms",
  "Notes",
  "Status",
] as const;

export const SUPPLIER_IMPORT_SAMPLE_ROW = [
  "Main Parts Supplier",
  "Juan Dela Cruz",
  "09171234567",
  "sales@example.com",
  "123 Industrial Ave",
  "Net 30",
  "Primary wheel supplier",
  "active",
] as const;

export const SUPPLIER_IMPORT_HEADER_ALIASES: Record<string, string> = {
  "supplier name": "supplierName",
  name: "supplierName",
  supplier: "supplierName",
  "contact person": "contactPerson",
  contact: "contactPerson",
  "contact number": "contactNumber",
  phone: "contactNumber",
  mobile: "contactNumber",
  email: "email",
  address: "address",
  "payment terms": "paymentTerms",
  terms: "paymentTerms",
  notes: "notes",
  status: "status",
};

export function buildSupplierImportTemplateCsv() {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replaceAll('"', '""')}"`;
    }

    return value;
  };

  return `${SUPPLIER_IMPORT_HEADERS.map(escape).join(",")}\n${SUPPLIER_IMPORT_SAMPLE_ROW.map(escape).join(",")}\n`;
}
