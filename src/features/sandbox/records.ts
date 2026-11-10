import { DateTime } from "luxon";

import { isDocumentJson, normalizeDocumentJson } from "@/components/document-engine/persistence/document-content";
import type { DocumentRecord, SaveDocumentInput } from "@/components/document-engine/persistence/types";
import { isDocumentTemplateName } from "@/components/document-engine/templates/registry";
import { deriveCustomerDisplayName } from "@/features/customers/schemas/customer-form-schema";
import { buildDuplicateDocumentTitle, normalizeDocumentTitle } from "@/features/documents/mappers";
import type { CustomerFormValues } from "@/features/customers/types";
import { recordInvoicePaymentSchema } from "@/features/invoices/schemas/invoice-forms";
import type { PaymentMethod } from "@/features/invoices/types";
import { jobOrderDetailsSchema, jobOrderStatusTransitionSchema } from "@/features/job-orders/schemas/job-order-forms";
import type { JobOrderStatus } from "@/features/job-orders/types";
import { canDeleteJobOrder } from "@/features/job-orders/utils";
import { payrollPeriodSchema } from "@/features/payroll/schemas/payroll-schemas";
import { generateSandboxPayrollCut } from "@/features/sandbox/payroll";
import type { ProductFormValues } from "@/features/products/types";
import type { QuotationReviseFormValues } from "@/features/quotations/schemas/quotation-revise-schema";
import type { QuotationFormValues } from "@/features/quotations/types";
import {
  calculateQuotationGrandTotal,
  calculateQuotationLineTotal,
  calculateQuotationSubtotal,
  createQuotationItem,
  toNumeric,
} from "@/features/quotations/utils";
import type { ServiceFormValues } from "@/features/services/types";
import type { StaffFormValues } from "@/features/staff/types";
import type { SupplierFormValues } from "@/features/suppliers/types";
import type { VehicleFormValues } from "@/features/vehicles/types";
import { roundCurrency } from "@/lib/currency";
import { deriveAttendanceStatusFromTimeIn } from "@/features/attendance/utils";
import { SANDBOX_IDS } from "@/features/sandbox/ids";
import {
  SANDBOX_SHOP_PUBLIC_IP,
  createSandboxServiceHistoryRecords,
  createSandboxShopSettings,
  createSandboxStockMovements,
  createSandboxTimekeepingDefaults,
} from "@/features/sandbox/seed";
import type {
  SandboxAttendanceAccess,
  SandboxBusiness,
  SandboxCustomer,
  SandboxDocumentSequenceMeta,
  SandboxDtrAmendment,
  SandboxHoliday,
  SandboxLine,
  SandboxLookupOption,
  SandboxRecordStatus,
  SandboxSnapshot,
  SandboxStockMovement,
} from "@/features/sandbox/types";
import { getBusinessNow, toUtcIso } from "@/lib/dates";

export function vehicleLabel(snapshot: SandboxSnapshot, vehicleId: string | null) {
  const vehicle = snapshot.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return "No vehicle";
  }

  const plate = vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : "";
  return `${vehicle.year ?? ""} ${vehicle.make} ${vehicle.model}${plate}`.trim();
}

export function customerName(snapshot: SandboxSnapshot, customerId: string) {
  return snapshot.customers.find((item) => item.id === customerId)?.displayName ?? "Unknown customer";
}

export function saveCustomerRecord(snapshot: SandboxSnapshot, values: CustomerFormValues, now = new Date()) {
  const timestamp = now.toISOString();
  const displayName = deriveCustomerDisplayName(values);
  const existing = values.customerId
    ? snapshot.customers.find((item) => item.id === values.customerId)
    : undefined;

  if (values.customerId && !existing) {
    throw new Error("Customer record does not exist.");
  }

  const nextCustomer: SandboxCustomer = {
    id: existing?.id ?? crypto.randomUUID(),
    customerCode: existing?.customerCode ?? formatSequence("CUS", snapshot.sequences.customer),
    customerType: values.customerType,
    displayName,
    firstName: values.firstName || null,
    lastName: values.lastName || null,
    companyName: values.companyName || null,
    contactNumber: values.contactNumber || null,
    email: values.email || null,
    address: values.address || null,
    notes: values.notes || null,
    status: values.status,
    linkedUserId: existing?.linkedUserId ?? null,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  return {
    id: nextCustomer.id,
    snapshot: {
      ...snapshot,
      sequences: existing
        ? snapshot.sequences
        : { ...snapshot.sequences, customer: snapshot.sequences.customer + 1 },
      customers: existing
        ? snapshot.customers.map((item) => (item.id === existing.id ? nextCustomer : item))
        : [...snapshot.customers, nextCustomer],
    },
  };
}

export function deleteCustomerRecord(snapshot: SandboxSnapshot, customerId: string) {
  const linked =
    snapshot.vehicles.some((item) => item.customerId === customerId) ||
    snapshot.quotations.some((item) => item.customerId === customerId) ||
    snapshot.jobOrders.some((item) => item.customerId === customerId) ||
    snapshot.invoices.some((item) => item.customerId === customerId);

  if (linked) {
    return {
      ok: false as const,
      message: "This customer cannot be deleted because it is already linked to vehicles or operational records.",
    };
  }

  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      customers: snapshot.customers.filter((item) => item.id !== customerId),
    },
  };
}

export function deleteVehicleRecord(snapshot: SandboxSnapshot, vehicleId: string) {
  const vehicle = snapshot.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return { ok: false as const, message: "Vehicle record not found." };
  }

  const linked =
    snapshot.quotations.some((item) => item.vehicleId === vehicleId) ||
    snapshot.jobOrders.some((item) => item.vehicleId === vehicleId) ||
    snapshot.invoices.some((item) => item.vehicleId === vehicleId);

  if (linked) {
    return {
      ok: false as const,
      message: "This vehicle cannot be deleted because it is already used in workshop records.",
    };
  }

  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      vehicles: snapshot.vehicles.filter((item) => item.id !== vehicleId),
    },
  };
}

function normalizeLookupLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function createVehicleMakeRecord(
  snapshot: SandboxSnapshot,
  input: { name: string; sortOrder: string },
) {
  const name = input.name.trim();
  const nameKey = normalizeLookupLabel(name);
  if (!name) {
    return { ok: false as const, message: "Make name is required." };
  }
  if (snapshot.vehicleMakes.some((item) => normalizeLookupLabel(item.name) === nameKey)) {
    return { ok: false as const, message: "This vehicle make already exists." };
  }

  const sortOrder = input.sortOrder.trim() ? Number(input.sortOrder) : 0;
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      vehicleMakes: [
        ...snapshot.vehicleMakes,
        {
          id: crypto.randomUUID(),
          name,
          status: "active" as const,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        },
      ],
    },
  };
}

export function createVehicleModelRecord(
  snapshot: SandboxSnapshot,
  input: { makeId: string; name: string; sortOrder: string },
) {
  const make = snapshot.vehicleMakes.find((item) => item.id === input.makeId);
  if (!make) {
    return { ok: false as const, message: "Selected make not found." };
  }

  const name = input.name.trim();
  const nameKey = normalizeLookupLabel(name);
  if (!name) {
    return { ok: false as const, message: "Model name is required." };
  }
  if (
    snapshot.vehicleModels.some(
      (item) => item.makeId === make.id && normalizeLookupLabel(item.name) === nameKey,
    )
  ) {
    return { ok: false as const, message: "This vehicle model already exists for that make." };
  }

  const sortOrder = input.sortOrder.trim() ? Number(input.sortOrder) : 0;
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      vehicleModels: [
        ...snapshot.vehicleModels,
        {
          id: crypto.randomUUID(),
          makeId: make.id,
          name,
          status: "active" as const,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        },
      ],
    },
  };
}

export function createVehicleLookupOptionRecord(
  snapshot: SandboxSnapshot,
  input: { lookupType: SandboxLookupOption["lookupType"]; label: string; sortOrder: string },
) {
  const label = input.label.trim();
  const labelKey = normalizeLookupLabel(label);
  if (!label) {
    return { ok: false as const, message: "Option label is required." };
  }
  if (
    snapshot.lookupOptions.some(
      (item) => item.lookupType === input.lookupType && normalizeLookupLabel(item.label) === labelKey,
    )
  ) {
    return { ok: false as const, message: "This option already exists." };
  }

  const sortOrder = input.sortOrder.trim() ? Number(input.sortOrder) : 0;
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      lookupOptions: [
        ...snapshot.lookupOptions,
        {
          id: crypto.randomUUID(),
          lookupType: input.lookupType,
          label,
          status: "active" as const,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        },
      ],
    },
  };
}

export function updateVehicleMakeStatusRecord(
  snapshot: SandboxSnapshot,
  makeId: string,
  status: SandboxRecordStatus,
) {
  if (!snapshot.vehicleMakes.some((item) => item.id === makeId)) {
    return { ok: false as const, message: "Vehicle make not found." };
  }
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      vehicleMakes: snapshot.vehicleMakes.map((item) =>
        item.id === makeId ? { ...item, status } : item,
      ),
    },
  };
}

export function updateVehicleModelStatusRecord(
  snapshot: SandboxSnapshot,
  modelId: string,
  status: SandboxRecordStatus,
) {
  if (!snapshot.vehicleModels.some((item) => item.id === modelId)) {
    return { ok: false as const, message: "Vehicle model not found." };
  }
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      vehicleModels: snapshot.vehicleModels.map((item) =>
        item.id === modelId ? { ...item, status } : item,
      ),
    },
  };
}

export function updateVehicleLookupOptionStatusRecord(
  snapshot: SandboxSnapshot,
  optionId: string,
  status: SandboxRecordStatus,
) {
  if (!snapshot.lookupOptions.some((item) => item.id === optionId)) {
    return { ok: false as const, message: "Lookup option not found." };
  }
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      lookupOptions: snapshot.lookupOptions.map((item) =>
        item.id === optionId ? { ...item, status } : item,
      ),
    },
  };
}

export function deleteVehicleMakeRecord(snapshot: SandboxSnapshot, makeId: string) {
  if (!snapshot.vehicleMakes.some((item) => item.id === makeId)) {
    return { ok: false as const, message: "Vehicle make not found." };
  }
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      vehicleMakes: snapshot.vehicleMakes.filter((item) => item.id !== makeId),
      vehicleModels: snapshot.vehicleModels.filter((item) => item.makeId !== makeId),
    },
  };
}

export function deleteVehicleModelRecord(snapshot: SandboxSnapshot, modelId: string) {
  if (!snapshot.vehicleModels.some((item) => item.id === modelId)) {
    return { ok: false as const, message: "Vehicle model not found." };
  }
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      vehicleModels: snapshot.vehicleModels.filter((item) => item.id !== modelId),
    },
  };
}

export function saveVehicleRecord(snapshot: SandboxSnapshot, values: VehicleFormValues, now = new Date()) {
  const timestamp = now.toISOString();
  const existing = values.vehicleId
    ? snapshot.vehicles.find((item) => item.id === values.vehicleId)
    : undefined;

  if (!snapshot.customers.some((item) => item.id === values.customerId)) {
    throw new Error("Customer record does not exist.");
  }

  const nextVehicle = {
    id: existing?.id ?? crypto.randomUUID(),
    customerId: values.customerId,
    make: values.make,
    model: values.model,
    year: values.year ? Number(values.year) : null,
    plateNumber: values.plateNumber || null,
    vin: values.vin || null,
    mileage: values.mileage ? Number(values.mileage) : null,
    transmission: values.transmission || null,
    engineSize: values.engineSize || null,
    variant: values.variant || null,
    fuelType: values.fuelType || null,
    color: values.color || null,
    status: values.status,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  return {
    id: nextVehicle.id,
    customerId: nextVehicle.customerId,
    snapshot: {
      ...snapshot,
      vehicles: existing
        ? snapshot.vehicles.map((item) => (item.id === existing.id ? nextVehicle : item))
        : [...snapshot.vehicles, nextVehicle],
    },
  };
}

export function saveProductRecord(
  snapshot: SandboxSnapshot,
  values: ProductFormValues,
  now = new Date(),
  productImageUrl?: string | null,
) {
  const timestamp = now.toISOString();
  const existing = values.productId
    ? snapshot.products.find((item) => item.id === values.productId)
    : undefined;
  const supplier = snapshot.suppliers.find((item) => item.id === values.supplierId);
  const nextProduct = {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name,
    sku: values.sku || null,
    barcode: values.barcode || null,
    productType: values.productType,
    categoryName: values.categoryId || existing?.categoryName || null,
    brandName: values.brandId || existing?.brandName || null,
    unitId: values.unitId || existing?.unitId || snapshot.products[0]?.unitId || crypto.randomUUID(),
    unitLabel: existing?.unitLabel ?? "pc",
    supplierId: supplier?.id ?? existing?.supplierId ?? null,
    costPrice: Number(values.costPrice || 0),
    sellingPrice: Number(values.sellingPrice || 0),
    reorderLevel: Number(values.reorderLevel || 0),
    availableQuantity: existing?.availableQuantity ?? 0,
    shelfLocation: values.shelfLocation || null,
    description: values.description || null,
    productImageUrl: productImageUrl ?? existing?.productImageUrl ?? null,
    websiteVisible: values.websiteVisible,
    status: values.status,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  return {
    product: nextProduct,
    snapshot: {
      ...snapshot,
      products: existing
        ? snapshot.products.map((item) => (item.id === existing.id ? nextProduct : item))
        : [...snapshot.products, nextProduct],
    },
  };
}

export function saveServiceRecord(snapshot: SandboxSnapshot, values: ServiceFormValues, now = new Date()) {
  const timestamp = now.toISOString();
  const existing = values.serviceId
    ? snapshot.services.find((item) => item.id === values.serviceId)
    : undefined;
  const nextService = {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name,
    category: values.category || null,
    description: values.description || null,
    laborPrice: Number(values.laborPrice || 0),
    estimatedDurationMinutes: values.estimatedDurationMinutes ? Number(values.estimatedDurationMinutes) : null,
    status: values.status,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  return {
    snapshot: {
      ...snapshot,
      services: existing
        ? snapshot.services.map((item) => (item.id === existing.id ? nextService : item))
        : [...snapshot.services, nextService],
    },
  };
}

export function saveSupplierRecord(snapshot: SandboxSnapshot, values: SupplierFormValues, now = new Date()) {
  const timestamp = now.toISOString();
  const existing = values.supplierId
    ? snapshot.suppliers.find((item) => item.id === values.supplierId)
    : undefined;
  const nextSupplier = {
    id: existing?.id ?? crypto.randomUUID(),
    supplierName: values.supplierName,
    contactPerson: values.contactPerson || null,
    contactNumber: values.contactNumber || null,
    email: values.email || null,
    address: values.address || null,
    paymentTerms: values.paymentTerms || null,
    notes: values.notes || null,
    status: values.status,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  return {
    snapshot: {
      ...snapshot,
      suppliers: existing
        ? snapshot.suppliers.map((item) => (item.id === existing.id ? nextSupplier : item))
        : [...snapshot.suppliers, nextSupplier],
    },
  };
}

export function saveStaffRecord(snapshot: SandboxSnapshot, values: StaffFormValues, now = new Date()) {
  const timestamp = now.toISOString();
  const existing = values.staffId ? snapshot.staff.find((item) => item.id === values.staffId) : undefined;
  const nextStaff = {
    id: existing?.id ?? crypto.randomUUID(),
    staffCode: values.staffCode || existing?.staffCode || formatSequence("STF", snapshot.sequences.staff),
    firstName: values.firstName,
    lastName: values.lastName,
    documentTitle: values.documentTitle || null,
    role: values.role,
    isPayrollEligible: values.isPayrollEligible,
    contactNumber: values.contactNumber || null,
    address: values.address || null,
    sssNumber: values.sssNumber || null,
    philhealthNumber: values.philhealthNumber || null,
    tinNumber: values.tinNumber || null,
    pagibigNumber: values.pagibigNumber || null,
    emergencyContactName: values.emergencyContactName || null,
    emergencyContactNumber: values.emergencyContactNumber || null,
    status: values.status,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    schedule: existing?.schedule ?? null,
    compensation: existing?.compensation ?? null,
  };

  return {
    snapshot: {
      ...snapshot,
      sequences: existing
        ? snapshot.sequences
        : { ...snapshot.sequences, staff: snapshot.sequences.staff + 1 },
      staff: existing
        ? snapshot.staff.map((item) => (item.id === existing.id ? nextStaff : item))
        : [...snapshot.staff, nextStaff],
    },
  };
}

export function saveBusinessProfile(snapshot: SandboxSnapshot, values: Partial<SandboxBusiness> & Pick<SandboxBusiness, "name">) {
  return {
    ...snapshot,
    branch: { ...snapshot.branch, name: values.name },
    business: {
      ...snapshot.business,
      ...values,
    },
  };
}

export function ensureSandboxShopSettings(snapshot: SandboxSnapshot): SandboxSnapshot {
  if (snapshot.shopSettings?.documentSequences?.length) {
    return snapshot;
  }
  return {
    ...snapshot,
    shopSettings: createSandboxShopSettings(),
  };
}

export function saveSandboxOperationalRules(
  snapshot: SandboxSnapshot,
  values: Pick<
    SandboxBusiness,
    | "allowGlobalProductCatalog"
    | "allowGlobalServiceCatalog"
    | "allowPartialPayments"
    | "requireInvoiceBeforeJobCompletion"
    | "requireInvoiceBeforeVehicleRelease"
    | "allowReleaseWithBalance"
    | "requireFullPaymentBeforeRelease"
    | "requireAdditionalItemPreApproval"
    | "enableBarcodeSupport"
    | "enableShelfLocation"
    | "payrollStandardDailyHours"
    | "payrollHolidayPremiumRate"
    | "payrollDefaultSssAmount"
    | "payrollDefaultPhilhealthAmount"
    | "payrollDefaultPagibigAmount"
  >,
) {
  return {
    ...snapshot,
    business: {
      ...snapshot.business,
      ...values,
    },
  };
}

export function saveSandboxThemeColors(
  snapshot: SandboxSnapshot,
  values: { themePrimaryColor: string; themeAccentColor: string },
) {
  const shop = ensureSandboxShopSettings(snapshot);
  return {
    ...shop,
    shopSettings: {
      ...shop.shopSettings!,
      themePrimaryColor: values.themePrimaryColor,
      themeAccentColor: values.themeAccentColor,
    },
  };
}

export function saveSandboxPublicPresence(
  snapshot: SandboxSnapshot,
  values: {
    websiteUrl: string;
    facebookUrl: string;
    facebookLabel: string;
    storeHours: Record<string, string>;
  },
) {
  const shop = ensureSandboxShopSettings(snapshot);
  return {
    ...shop,
    shopSettings: {
      ...shop.shopSettings!,
      websiteUrl: values.websiteUrl,
      facebookUrl: values.facebookUrl,
      facebookLabel: values.facebookLabel,
      storeHours: values.storeHours,
    },
  };
}

export function saveSandboxDocumentSequence(
  snapshot: SandboxSnapshot,
  values: {
    key: SandboxDocumentSequenceMeta["key"];
    prefix: string;
    padding: number;
    lastValue: number;
  },
) {
  const shop = ensureSandboxShopSettings(snapshot);
  const sequences = { ...shop.sequences };
  if (values.key === "quotation") sequences.quotation = values.lastValue;
  if (values.key === "job_order") sequences.jobOrder = values.lastValue;
  if (values.key === "invoice") sequences.invoice = values.lastValue;
  if (values.key === "sale") sequences.pos = values.lastValue;

  return {
    ...shop,
    sequences,
    shopSettings: {
      ...shop.shopSettings!,
      documentSequences: shop.shopSettings!.documentSequences.map((item) =>
        item.key === values.key
          ? { ...item, prefix: values.prefix, padding: values.padding }
          : item,
      ),
    },
  };
}

export function saveQuotationFromForm(
  snapshot: SandboxSnapshot,
  values: QuotationFormValues,
  now = new Date(),
) {
  const existing = values.quotationId
    ? snapshot.quotations.find((item) => item.id === values.quotationId)
    : undefined;

  if (values.quotationId && !existing) {
    throw new Error("Quotation does not exist.");
  }

  if (existing?.status === "approved" || existing?.status === "rejected" || existing?.status === "expired") {
    throw new Error("This quotation can no longer be edited.");
  }

  if (!snapshot.customers.some((item) => item.id === values.customerId)) {
    throw new Error("Customer record does not exist.");
  }

  if (!snapshot.vehicles.some((item) => item.id === values.vehicleId && item.customerId === values.customerId)) {
    throw new Error("Vehicle record does not exist for this customer.");
  }

  const timestamp = now.toISOString();
  const id = existing?.id ?? crypto.randomUUID();
  const subtotal = calculateQuotationSubtotal(values.items);
  const discount = toNumeric(values.discount);
  const tax = toNumeric(values.tax);
  const totalAmount = calculateQuotationGrandTotal({
    items: values.items,
    discount: values.discount,
    tax: values.tax,
  });
  const lines = quotationLinesFromForm(id, values.items);

  return {
    id,
    snapshot: {
      ...snapshot,
      sequences: existing
        ? snapshot.sequences
        : { ...snapshot.sequences, quotation: snapshot.sequences.quotation + 1 },
      quotations: existing
        ? snapshot.quotations.map((item) =>
            item.id === id
              ? {
                  ...item,
                  customerId: values.customerId,
                  vehicleId: values.vehicleId,
                  status: values.status,
                  discount,
                  tax,
                  subtotal,
                  totalAmount,
                  notes: values.natureOfRepair || item.notes,
                  natureOfRepair: values.natureOfRepair || null,
                  inspectionNotes: values.inspectionNotes || null,
                }
              : item,
          )
        : [
            ...snapshot.quotations,
            {
              id,
              quotationNumber: formatSequence("Q", snapshot.sequences.quotation),
              customerId: values.customerId,
              vehicleId: values.vehicleId,
              status: values.status,
              discount,
              tax,
              subtotal,
              totalAmount,
              notes: values.natureOfRepair || null,
              natureOfRepair: values.natureOfRepair || null,
              inspectionNotes: values.inspectionNotes || null,
              createdAt: timestamp,
              approvedAt: null,
            },
          ],
      quotationLines: [...snapshot.quotationLines.filter((item) => item.parentId !== id), ...lines],
    },
  };
}

export function reviseQuotationRecord(snapshot: SandboxSnapshot, values: QuotationReviseFormValues) {
  const quotation = snapshot.quotations.find((item) => item.id === values.quotationId);
  if (!quotation) {
    throw new Error("Quotation does not exist.");
  }

  if (quotation.status !== "approved") {
    throw new Error("Only an approved quotation can be revised.");
  }

  if (quotation.customerId !== values.customerId || quotation.vehicleId !== values.vehicleId) {
    throw new Error("Customer and vehicle cannot be changed while revising an approved quotation.");
  }

  const subtotal = calculateQuotationSubtotal(values.items);
  const discount = toNumeric(values.discount);
  const tax = toNumeric(values.tax);
  const totalAmount = calculateQuotationGrandTotal({
    items: values.items,
    discount: values.discount,
    tax: values.tax,
  });
  const lines = quotationLinesFromForm(quotation.id, values.items);
  const jobOrder = snapshot.jobOrders.find((item) => item.quotationId === quotation.id);

  return {
    id: quotation.id,
    snapshot: {
      ...snapshot,
      quotations: snapshot.quotations.map((item) =>
        item.id === quotation.id
          ? {
              ...item,
              discount,
              tax,
              subtotal,
              totalAmount,
              notes: values.natureOfRepair || item.notes,
              natureOfRepair: values.natureOfRepair || null,
              inspectionNotes: values.inspectionNotes || null,
            }
          : item,
      ),
      quotationLines: [...snapshot.quotationLines.filter((item) => item.parentId !== quotation.id), ...lines],
      jobOrderLines: jobOrder
        ? [
            ...snapshot.jobOrderLines.filter((item) => item.parentId !== jobOrder.id),
            ...lines.map((item) => ({ ...item, id: crypto.randomUUID(), parentId: jobOrder.id })),
          ]
        : snapshot.jobOrderLines,
    },
  };
}

export function rejectQuotationRecord(snapshot: SandboxSnapshot, quotationId: string) {
  const quotation = snapshot.quotations.find((item) => item.id === quotationId);
  if (!quotation) {
    throw new Error("Quotation does not exist.");
  }

  if (quotation.status === "approved") {
    throw new Error("Approved quotations cannot be rejected.");
  }

  return {
    ...snapshot,
    quotations: snapshot.quotations.map((item) =>
      item.id === quotationId ? { ...item, status: "rejected" as const, approvedAt: null } : item,
    ),
  };
}

export function deleteQuotationRecord(snapshot: SandboxSnapshot, quotationId: string) {
  const quotation = snapshot.quotations.find((item) => item.id === quotationId);
  if (!quotation) {
    return { ok: false as const, message: "Quotation not found." };
  }

  if (quotation.status === "approved" || snapshot.jobOrders.some((item) => item.quotationId === quotationId)) {
    return {
      ok: false as const,
      message: "Approved quotations must be managed through the linked job order instead.",
    };
  }

  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      quotations: snapshot.quotations.filter((item) => item.id !== quotationId),
      quotationLines: snapshot.quotationLines.filter((item) => item.parentId !== quotationId),
    },
  };
}

function quotationLinesFromForm(parentId: string, items: QuotationFormValues["items"]): SandboxLine[] {
  return items.map((item) => {
    const formItem = createQuotationItem(item);
    const total = calculateQuotationLineTotal(formItem);
    return {
      id: crypto.randomUUID(),
      parentId,
      itemType: item.itemType,
      productId: item.productId || null,
      serviceId: item.serviceId || null,
      description: item.description.trim(),
      quantity: toNumeric(item.quantity),
      unitPrice: toNumeric(item.unitPrice),
      total,
    };
  });
}

export function createQuotationRecord(
  snapshot: SandboxSnapshot,
  input: {
    customerId: string;
    vehicleId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    itemType: SandboxLine["itemType"];
  },
  now = new Date(),
) {
  const timestamp = now.toISOString();
  const id = crypto.randomUUID();
  const formItem = createQuotationItem({
    itemType: input.itemType,
    description: input.description,
    quantity: String(input.quantity),
    unitPrice: String(input.unitPrice),
  });
  const lineTotal = calculateQuotationLineTotal(formItem);
  const totalAmount = calculateQuotationGrandTotal({
    items: [formItem],
    discount: "0",
    tax: "0",
  });

  return {
    id,
    snapshot: {
      ...snapshot,
      sequences: { ...snapshot.sequences, quotation: snapshot.sequences.quotation + 1 },
      quotations: [
        ...snapshot.quotations,
        {
          id,
          quotationNumber: formatSequence("Q", snapshot.sequences.quotation),
          customerId: input.customerId,
          vehicleId: input.vehicleId,
          status: "draft" as const,
          discount: 0,
          tax: 0,
          subtotal: totalAmount,
          totalAmount,
          notes: null,
          createdAt: timestamp,
          approvedAt: null,
        },
      ],
      quotationLines: [
        ...snapshot.quotationLines,
        {
          id: crypto.randomUUID(),
          parentId: id,
          itemType: input.itemType,
          productId: null,
          serviceId: null,
          description: input.description,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          total: lineTotal,
        },
      ],
    },
  };
}

export function approveQuotationRecord(snapshot: SandboxSnapshot, quotationId: string, now = new Date()) {
  const quotation = snapshot.quotations.find((item) => item.id === quotationId);
  if (!quotation) {
    throw new Error("Quotation record not found.");
  }

  if (snapshot.jobOrders.some((item) => item.quotationId === quotationId)) {
    return {
      ...snapshot,
      quotations: snapshot.quotations.map((item) =>
        item.id === quotationId
          ? { ...item, status: "approved" as const, approvedAt: item.approvedAt ?? now.toISOString() }
          : item,
      ),
    };
  }

  const timestamp = now.toISOString();
  const jobOrderId = crypto.randomUUID();
  const lines = snapshot.quotationLines.filter((item) => item.parentId === quotationId);

  return {
    ...snapshot,
    sequences: { ...snapshot.sequences, jobOrder: snapshot.sequences.jobOrder + 1 },
    quotations: snapshot.quotations.map((item) =>
      item.id === quotationId ? { ...item, status: "approved" as const, approvedAt: timestamp } : item,
    ),
    jobOrders: [
      ...snapshot.jobOrders,
      {
        id: jobOrderId,
        jobOrderNumber: formatSequence("JO", snapshot.sequences.jobOrder),
        quotationId,
        customerId: quotation.customerId,
        vehicleId: quotation.vehicleId,
        status: "pending" as const,
        customerConcern: quotation.notes,
        inspectionNotes: null,
        diagnosis: null,
        workPerformed: null,
        mileageIn: snapshot.vehicles.find((item) => item.id === quotation.vehicleId)?.mileage ?? null,
        mileageOut: null,
        assignedStaffId: null,
        createdAt: timestamp,
        startedAt: null,
        completedAt: null,
        releasedAt: null,
      },
    ],
    jobOrderLines: [
      ...snapshot.jobOrderLines,
      ...lines.map((item) => ({ ...item, id: crypto.randomUUID(), parentId: jobOrderId })),
    ],
  };
}

export function updateJobOrderStatusRecord(snapshot: SandboxSnapshot, jobOrderId: string, nextStatus: JobOrderStatus, now = new Date()) {
  const parsed = jobOrderStatusTransitionSchema.safeParse({
    jobOrderId,
    nextStatus,
    cancellationReason: "",
  });
  if (!parsed.success) {
    throw new Error("Job order status is not valid.");
  }

  const timestamp = now.toISOString();
  return {
    ...snapshot,
    jobOrders: snapshot.jobOrders.map((item) => {
      if (item.id !== jobOrderId) {
        return item;
      }

      return {
        ...item,
        status: nextStatus,
        startedAt: nextStatus === "in_progress" ? item.startedAt ?? timestamp : item.startedAt,
        completedAt: nextStatus === "completed" ? timestamp : item.completedAt,
        releasedAt: nextStatus === "released" ? timestamp : item.releasedAt,
      };
    }),
  };
}

export function saveJobOrderDetailsRecord(
  snapshot: SandboxSnapshot,
  values: {
    jobOrderId: string;
    mileageIn: string;
    mileageOut: string;
    customerConcern: string;
    inspectionNotes: string;
    diagnosis: string;
    workPerformed: string;
  },
) {
  const parsed = jobOrderDetailsSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error };
  }

  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      jobOrders: snapshot.jobOrders.map((item) =>
        item.id === values.jobOrderId
          ? {
              ...item,
              mileageIn: values.mileageIn ? Number(values.mileageIn) : null,
              mileageOut: values.mileageOut ? Number(values.mileageOut) : null,
              customerConcern: values.customerConcern || null,
              inspectionNotes: values.inspectionNotes || null,
              diagnosis: values.diagnosis || null,
              workPerformed: values.workPerformed || null,
            }
          : item,
      ),
    },
  };
}

export function recordPartUsageRecord(snapshot: SandboxSnapshot, jobOrderId: string, productId: string, quantity: number, now = new Date()) {
  const product = snapshot.products.find((item) => item.id === productId);
  if (!product) {
    throw new Error("Product record not found.");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (product.availableQuantity < quantity) {
    throw new Error("Not enough stock for this part.");
  }

  return {
    ...snapshot,
    products: snapshot.products.map((item) =>
      item.id === productId
        ? { ...item, availableQuantity: roundCurrency(item.availableQuantity - quantity) }
        : item,
    ),
    partUsage: [
      ...snapshot.partUsage,
        {
        id: crypto.randomUUID(),
        jobOrderId,
        productId,
        quantity,
        usageType: "use" as const,
        createdAt: now.toISOString(),
      },
    ],
  };
}

export function createInvoiceFromJobOrderRecord(snapshot: SandboxSnapshot, jobOrderId: string, now = new Date()) {
  const jobOrder = snapshot.jobOrders.find((item) => item.id === jobOrderId);
  if (!jobOrder) {
    throw new Error("Job order record not found.");
  }

  if (snapshot.invoices.some((item) => item.jobOrderId === jobOrderId && item.status !== "cancelled")) {
    throw new Error("This job order already has an invoice.");
  }

  const lines = snapshot.jobOrderLines.filter((item) => {
    if (item.parentId !== jobOrderId) return false;
    const approvalStatus = item.approvalStatus ?? "not_required";
    return approvalStatus === "not_required" || approvalStatus === "approved";
  });
  const subtotal = roundCurrency(lines.reduce((sum, item) => sum + item.total, 0));
  const timestamp = now.toISOString();
  const invoiceId = crypto.randomUUID();

  return {
    id: invoiceId,
    snapshot: {
      ...snapshot,
      sequences: { ...snapshot.sequences, invoice: snapshot.sequences.invoice + 1 },
      invoices: [
        ...snapshot.invoices,
        {
          id: invoiceId,
          invoiceNumber: formatSequence("INV", snapshot.sequences.invoice),
          jobOrderId,
          customerId: jobOrder.customerId,
          vehicleId: jobOrder.vehicleId,
          source: "job_order" as const,
          subtotal,
          discount: 0,
          tax: 0,
          totalAmount: subtotal,
          paidAmount: 0,
          balance: subtotal,
          status: "unpaid" as const,
          invoiceDate: DateTime.fromJSDate(now).setZone("Asia/Manila").toISODate() ?? timestamp.slice(0, 10),
          createdAt: timestamp,
          cancellationReason: null,
        },
      ],
      invoiceLines: [
        ...snapshot.invoiceLines,
        ...lines.map((item) => ({ ...item, id: crypto.randomUUID(), parentId: invoiceId })),
      ],
      jobOrders: snapshot.jobOrders.map((item) =>
        item.id === jobOrderId ? { ...item, status: "ready_for_billing" as const } : item,
      ),
    },
  };
}

function currentMechanicAssignments(jobOrder: SandboxSnapshot["jobOrders"][number]) {
  if (jobOrder.mechanicAssignments) return jobOrder.mechanicAssignments;
  if (!jobOrder.assignedStaffId) return [];

  return [{
    id: jobOrder.assignedStaffId,
    staffId: jobOrder.assignedStaffId,
    taskDescription: null,
    startedAt: jobOrder.startedAt,
    completedAt: jobOrder.completedAt,
  }];
}

export function assignMechanicRecord(
  snapshot: SandboxSnapshot,
  values: { jobOrderId: string; staffId: string; taskDescription: string },
  now = new Date(),
) {
  const jobOrder = snapshot.jobOrders.find((item) => item.id === values.jobOrderId);
  if (!jobOrder) throw new Error("Job order record not found.");

  const staff = snapshot.staff.find((item) => item.id === values.staffId && item.role === "mechanic" && item.status === "active");
  if (!staff) throw new Error("Mechanic record not found.");

  const assignments = currentMechanicAssignments(jobOrder);
  if (assignments.some((item) => item.staffId === values.staffId)) {
    throw new Error("This mechanic is already assigned.");
  }

  return {
    ...snapshot,
    jobOrders: snapshot.jobOrders.map((item) =>
      item.id === jobOrder.id
        ? {
            ...item,
            assignedStaffId: item.assignedStaffId ?? values.staffId,
            mechanicAssignments: [
              ...assignments,
              {
                id: crypto.randomUUID(),
                staffId: values.staffId,
                taskDescription: values.taskDescription || null,
                startedAt: now.toISOString(),
                completedAt: null,
              },
            ],
          }
        : item,
    ),
  };
}

export function removeMechanicRecord(snapshot: SandboxSnapshot, jobOrderId: string, assignmentId: string) {
  const jobOrder = snapshot.jobOrders.find((item) => item.id === jobOrderId);
  if (!jobOrder) throw new Error("Job order record not found.");

  const assignments = currentMechanicAssignments(jobOrder).filter((item) => item.id !== assignmentId);
  return {
    ...snapshot,
    jobOrders: snapshot.jobOrders.map((item) =>
      item.id === jobOrderId
        ? {
            ...item,
            assignedStaffId: assignments[0]?.staffId ?? null,
            mechanicAssignments: assignments,
          }
        : item,
    ),
  };
}

export function setJobOrderChecklistRecord(
  snapshot: SandboxSnapshot,
  jobOrderId: string,
  jobOrderItemId: string,
  completed: boolean,
) {
  const jobOrder = snapshot.jobOrders.find((item) => item.id === jobOrderId);
  const line = snapshot.jobOrderLines.find((item) => item.id === jobOrderItemId && item.parentId === jobOrderId);
  if (!jobOrder || !line) throw new Error("Job order item does not exist.");

  const completedIds = new Set(jobOrder.completedChecklistItemIds ?? []);
  if (completed) completedIds.add(jobOrderItemId);
  else completedIds.delete(jobOrderItemId);

  return {
    ...snapshot,
    jobOrders: snapshot.jobOrders.map((item) =>
      item.id === jobOrderId ? { ...item, completedChecklistItemIds: [...completedIds] } : item,
    ),
  };
}

export function addJobOrderItemRecord(
  snapshot: SandboxSnapshot,
  values: {
    jobOrderId: string;
    itemType: SandboxSnapshot["jobOrderLines"][number]["itemType"];
    productId: string;
    serviceId: string;
    description: string;
    quantity: string;
    unitPrice: string;
  },
) {
  if (!snapshot.jobOrders.some((item) => item.id === values.jobOrderId)) {
    throw new Error("Job order record not found.");
  }

  const quantity = toNumeric(values.quantity);
  const unitPrice = toNumeric(values.unitPrice);
  return {
    ...snapshot,
    jobOrderLines: [
      ...snapshot.jobOrderLines,
      {
        id: crypto.randomUUID(),
        parentId: values.jobOrderId,
        itemType: values.itemType,
        productId: values.productId || null,
        serviceId: values.serviceId || null,
        description: values.description,
        quantity,
        unitPrice,
        total: roundCurrency(quantity * unitPrice),
        isAdditional: true,
        approvalStatus: "pending" as const,
      },
    ],
  };
}

export function updateJobOrderItemRecord(
  snapshot: SandboxSnapshot,
  values: {
    jobOrderId: string;
    jobOrderItemId: string;
    description: string;
    quantity: string;
    unitPrice: string;
  },
) {
  const line = snapshot.jobOrderLines.find((item) => item.id === values.jobOrderItemId);
  if (!line || line.parentId !== values.jobOrderId) {
    throw new Error("Job order item does not belong to the selected job order.");
  }

  const quantity = toNumeric(values.quantity);
  const unitPrice = toNumeric(values.unitPrice);
  return {
    ...snapshot,
    jobOrderLines: snapshot.jobOrderLines.map((item) =>
      item.id === values.jobOrderItemId
        ? {
            ...item,
            description: values.description,
            quantity,
            unitPrice,
            total: roundCurrency(quantity * unitPrice),
          }
        : item,
    ),
  };
}

export function setJobOrderItemApprovalRecord(
  snapshot: SandboxSnapshot,
  jobOrderId: string,
  jobOrderItemId: string,
  approvalStatus: "pending" | "approved" | "rejected",
) {
  const line = snapshot.jobOrderLines.find((item) => item.id === jobOrderItemId);
  if (!line || line.parentId !== jobOrderId) {
    throw new Error("Job order item does not belong to the selected job order.");
  }

  return {
    ...snapshot,
    jobOrderLines: snapshot.jobOrderLines.map((item) =>
      item.id === jobOrderItemId ? { ...item, approvalStatus } : item,
    ),
  };
}

export function recordJobOrderPartMovementRecord(
  snapshot: SandboxSnapshot,
  mode: "use" | "return",
  values: { jobOrderId: string; jobOrderItemId: string; quantity: string; notes: string },
  now = new Date(),
) {
  const line = snapshot.jobOrderLines.find((item) => item.id === values.jobOrderItemId && item.parentId === values.jobOrderId);
  if (!line?.productId) throw new Error("This line is not a stocked part.");

  const quantity = toNumeric(values.quantity);
  if (quantity <= 0) throw new Error("Quantity must be greater than zero.");

  const product = snapshot.products.find((item) => item.id === line.productId);
  if (!product) throw new Error("Product record not found.");

  const movements = snapshot.partUsage.filter((item) => {
    if (item.jobOrderId !== values.jobOrderId || item.productId !== line.productId) return false;
    return item.jobOrderItemId ? item.jobOrderItemId === line.id : true;
  });
  const used = movements.filter((item) => (item.usageType ?? "use") === "use").reduce((sum, item) => sum + item.quantity, 0);
  const returned = movements.filter((item) => item.usageType === "return").reduce((sum, item) => sum + item.quantity, 0);
  const netUsed = used - returned;

  if (mode === "use") {
    if (product.availableQuantity < quantity) throw new Error("Not enough stock for this part.");
    if (netUsed + quantity > line.quantity) throw new Error("Quantity is more than this line allows.");
  } else if (quantity > netUsed) {
    throw new Error("Return quantity is more than the parts used.");
  }

  return {
    ...snapshot,
    products: snapshot.products.map((item) =>
      item.id === product.id
        ? {
            ...item,
            availableQuantity: roundCurrency(item.availableQuantity + (mode === "return" ? quantity : -quantity)),
          }
        : item,
    ),
    partUsage: [
      ...snapshot.partUsage,
      {
        id: crypto.randomUUID(),
        jobOrderId: values.jobOrderId,
        jobOrderItemId: line.id,
        productId: line.productId,
        quantity,
        usageType: mode,
        notes: values.notes || null,
        createdAt: now.toISOString(),
      },
    ],
  };
}

export function deleteJobOrderRecord(snapshot: SandboxSnapshot, jobOrderId: string) {
  const jobOrder = snapshot.jobOrders.find((item) => item.id === jobOrderId);
  if (!jobOrder) return { ok: false as const, message: "Job order not found." };

  const invoice = snapshot.invoices.find((item) => item.jobOrderId === jobOrderId && item.status !== "cancelled");
  const items = snapshot.jobOrderLines
    .filter((item) => item.parentId === jobOrderId)
    .map((item) => ({
      usageStatus: snapshot.partUsage.some((usage) => usage.jobOrderId === jobOrderId && usage.productId === item.productId && (usage.usageType ?? "use") === "use")
        ? "used" as const
        : "planned" as const,
    }));

  if (!canDeleteJobOrder({ status: jobOrder.status, hasInvoice: Boolean(invoice), items })) {
    return { ok: false as const, message: "This job order cannot be deleted." };
  }

  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      jobOrders: snapshot.jobOrders.filter((item) => item.id !== jobOrderId),
      jobOrderLines: snapshot.jobOrderLines.filter((item) => item.parentId !== jobOrderId),
      partUsage: snapshot.partUsage.filter((item) => item.jobOrderId !== jobOrderId),
      quotations: snapshot.quotations.map((item) =>
        item.id === jobOrder.quotationId && item.status === "approved"
          ? { ...item, status: "pending_approval" as const, approvedAt: null }
          : item,
      ),
    },
  };
}

export function releaseJobOrderVehicleRecord(snapshot: SandboxSnapshot, jobOrderId: string, now = new Date()) {
  return updateJobOrderStatusRecord(snapshot, jobOrderId, "released", now);
}

export function cancelInvoiceRecord(
  snapshot: SandboxSnapshot,
  input: { invoiceId: string; cancellationReason: string },
  now = new Date(),
) {
  const invoice = snapshot.invoices.find((item) => item.id === input.invoiceId);
  if (!invoice) {
    return { ok: false as const, message: "Invoice record not found." };
  }
  if (invoice.status === "cancelled") {
    return { ok: false as const, message: "This invoice is already cancelled." };
  }
  if (invoice.paidAmount > 0) {
    return { ok: false as const, message: "Paid invoices cannot be cancelled." };
  }
  if (invoice.source === "pos") {
    return { ok: false as const, message: "POS invoices cannot be cancelled from this screen." };
  }
  const jobOrder = invoice.jobOrderId
    ? snapshot.jobOrders.find((item) => item.id === invoice.jobOrderId)
    : null;
  if (jobOrder?.releasedAt) {
    return { ok: false as const, message: "Invoices for released vehicles cannot be cancelled." };
  }

  const timestamp = now.toISOString();
  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      invoices: snapshot.invoices.map((item) =>
        item.id === invoice.id
          ? {
              ...item,
              status: "cancelled" as const,
              cancelledAt: timestamp,
              cancellationReason: input.cancellationReason.trim(),
            }
          : item,
      ),
    },
  };
}

export function recordPaymentRecord(
  snapshot: SandboxSnapshot,
  input: {
    invoiceId: string;
    amount: string;
    paymentMethod: string;
    referenceNumber: string;
    notes: string;
  },
  now = new Date(),
) {
  const parsed = recordInvoicePaymentSchema.safeParse({
    ...input,
    jobOrderId: undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error };
  }

  const invoice = snapshot.invoices.find((item) => item.id === input.invoiceId);
  if (!invoice || invoice.status === "cancelled") {
    throw new Error("Invoice record not found.");
  }

  const amount = roundCurrency(Number(input.amount));
  if (amount > invoice.balance) {
    throw new Error("Payment cannot be more than the remaining balance.");
  }

  const paidAmount = roundCurrency(invoice.paidAmount + amount);
  const balance = roundCurrency(invoice.totalAmount - paidAmount);
  const status = balance <= 0 ? "paid" : paidAmount > 0 ? "partially_paid" : invoice.status;
  const timestamp = now.toISOString();

  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      sequences: { ...snapshot.sequences, payment: snapshot.sequences.payment + 1 },
      payments: [
        ...snapshot.payments,
        {
          id: crypto.randomUUID(),
          paymentNumber: formatSequence("PAY", snapshot.sequences.payment),
          invoiceId: invoice.id,
          amount,
          paymentMethod: input.paymentMethod as PaymentMethod,
          referenceNumber: input.referenceNumber || null,
          notes: input.notes || null,
          paidAt: timestamp,
        },
      ],
      invoices: snapshot.invoices.map((item) =>
        item.id === invoice.id ? { ...item, paidAmount, balance, status } : item,
      ),
      jobOrders: snapshot.jobOrders.map((item) =>
        item.id === invoice.jobOrderId && status === "paid" ? { ...item, status: "paid" as const } : item,
      ),
    },
  };
}

export function ensureSandboxStockMovements(snapshot: SandboxSnapshot): SandboxSnapshot {
  if (snapshot.stockMovements) return snapshot;
  const createdAt = snapshot.products[0]?.createdAt ?? new Date().toISOString();
  return {
    ...snapshot,
    stockMovements: createSandboxStockMovements(createdAt, createdAt),
  };
}

export function ensureSandboxServiceHistory(snapshot: SandboxSnapshot): SandboxSnapshot {
  const hasSampleHistory = snapshot.jobOrders.some(
    (jobOrder) =>
      jobOrder.id === SANDBOX_IDS.jobOrderHistoryVios ||
      jobOrder.id === SANDBOX_IDS.jobOrderHistoryL300 ||
      jobOrder.id === SANDBOX_IDS.jobOrderHistoryCivic ||
      jobOrder.id === SANDBOX_IDS.jobOrderHistoryInnova,
  );
  if (hasSampleHistory) return snapshot;

  const createdAt = snapshot.jobOrders[0]?.createdAt ?? snapshot.products[0]?.createdAt ?? new Date().toISOString();
  const history = createSandboxServiceHistoryRecords(DateTime.fromISO(createdAt).setZone("Asia/Manila"), createdAt);
  const knownIds = new Set(history.jobOrders.map((item) => item.id));

  return {
    ...snapshot,
    jobOrders: [
      ...snapshot.jobOrders.filter((item) => !knownIds.has(item.id)),
      ...history.jobOrders,
    ],
    jobOrderLines: [
      ...snapshot.jobOrderLines.filter((item) => !knownIds.has(item.parentId)),
      ...history.jobOrderLines,
    ],
    invoices: snapshot.invoices.map((invoice) =>
      invoice.id === SANDBOX_IDS.invoice && !invoice.jobOrderId
        ? { ...invoice, jobOrderId: SANDBOX_IDS.jobOrderHistoryL300 }
        : invoice,
    ),
  };
}

function withStockMovement(
  snapshot: SandboxSnapshot,
  movement: SandboxStockMovement,
  products: SandboxSnapshot["products"],
) {
  const shop = ensureSandboxStockMovements(snapshot);
  return {
    ...shop,
    products,
    stockMovements: [movement, ...(shop.stockMovements ?? [])],
  };
}

export function applySandboxInventoryMovement(
  snapshot: SandboxSnapshot,
  input: {
    productId: string;
    mode: "stock_in" | "recount" | "damaged";
    quantity: number;
    notes: string | null;
  },
  now = new Date(),
) {
  const product = snapshot.products.find((item) => item.id === input.productId);
  if (!product) return { ok: false as const, message: "Product record not found." };

  const previousQuantity = product.availableQuantity;
  let newQuantity = previousQuantity;
  let movementType: SandboxStockMovement["movementType"] = "stock_in";
  let referenceType = "stock_in";

  if (input.mode === "stock_in") {
    if (input.quantity <= 0) return { ok: false as const, message: "Quantity must be greater than zero." };
    newQuantity = roundCurrency(previousQuantity + input.quantity);
    movementType = "stock_in";
  } else if (input.mode === "recount") {
    if (input.quantity < 0) return { ok: false as const, message: "Counted quantity must be zero or greater." };
    newQuantity = roundCurrency(input.quantity);
    movementType = "adjustment";
    referenceType = "adjustment";
  } else {
    if (input.quantity <= 0) return { ok: false as const, message: "Damaged quantity must be greater than zero." };
    if (previousQuantity < input.quantity) return { ok: false as const, message: "Not enough stock to mark as damaged." };
    newQuantity = roundCurrency(previousQuantity - input.quantity);
    movementType = "damaged";
    referenceType = "damaged";
  }

  const products = snapshot.products.map((item) =>
    item.id === product.id ? { ...item, availableQuantity: newQuantity, updatedAt: now.toISOString() } : item,
  );

  return {
    ok: true as const,
    snapshot: withStockMovement(snapshot, {
      id: crypto.randomUUID(),
      productId: product.id,
      movementType,
      quantity: input.mode === "recount" ? Math.abs(roundCurrency(newQuantity - previousQuantity)) : input.quantity,
      previousQuantity,
      newQuantity,
      referenceType,
      notes: input.notes,
      createdAt: now.toISOString(),
    }, products),
  };
}

export function updateSandboxInventorySettings(
  snapshot: SandboxSnapshot,
  input: { productId: string; reorderLevel: number | null; shelfLocation: string | null },
) {
  const product = snapshot.products.find((item) => item.id === input.productId);
  if (!product) return { ok: false as const, message: "Product record not found." };

  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      products: snapshot.products.map((item) =>
        item.id === product.id
          ? {
              ...item,
              reorderLevel: input.reorderLevel ?? 0,
              shelfLocation: input.shelfLocation,
            }
          : item,
      ),
    },
  };
}

export function receiveStockRecord(snapshot: SandboxSnapshot, productId: string, quantity: number) {
  const result = applySandboxInventoryMovement(snapshot, {
    productId,
    mode: "stock_in",
    quantity,
    notes: null,
  });
  if (!result.ok) throw new Error(result.message);
  return result.snapshot;
}

export function completePosSaleRecord(
  snapshot: SandboxSnapshot,
  input: {
    customerId: string | null;
    productId: string;
    quantity: number;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
  },
  now = new Date(),
) {
  const product = snapshot.products.find((item) => item.id === input.productId);
  if (!product) {
    throw new Error("Product record not found.");
  }

  if (product.availableQuantity < input.quantity) {
    throw new Error("Not enough stock for this sale.");
  }

  const subtotal = roundCurrency(product.sellingPrice * input.quantity);
  const timestamp = now.toISOString();
  const invoiceId = crypto.randomUUID();
  const customerId = input.customerId ?? snapshot.customers[0]?.id;
  if (!customerId) {
    throw new Error("Add a customer before completing a sale.");
  }

  const nextSnapshot: SandboxSnapshot = {
    ...snapshot,
    sequences: {
      ...snapshot.sequences,
      invoice: snapshot.sequences.invoice + 1,
      payment: snapshot.sequences.payment + 1,
      pos: snapshot.sequences.pos + 1,
    },
    products: snapshot.products.map((item) =>
      item.id === product.id
        ? { ...item, availableQuantity: roundCurrency(item.availableQuantity - input.quantity) }
        : item,
    ),
    invoices: [
      ...snapshot.invoices,
      {
        id: invoiceId,
        invoiceNumber: formatSequence("INV", snapshot.sequences.invoice),
        jobOrderId: null,
        customerId,
        vehicleId: null,
        source: "pos",
        subtotal,
        discount: 0,
        tax: 0,
        totalAmount: subtotal,
        paidAmount: subtotal,
        balance: 0,
        status: "paid",
        invoiceDate: DateTime.fromJSDate(now).setZone("Asia/Manila").toISODate() ?? timestamp.slice(0, 10),
        createdAt: timestamp,
        cancellationReason: null,
      },
    ],
    invoiceLines: [
      ...snapshot.invoiceLines,
      {
        id: crypto.randomUUID(),
        parentId: invoiceId,
        itemType: "product",
        productId: product.id,
        serviceId: null,
        description: product.name,
        quantity: input.quantity,
        unitPrice: product.sellingPrice,
        total: subtotal,
      },
    ],
    payments: [
      ...snapshot.payments,
      {
        id: crypto.randomUUID(),
        paymentNumber: formatSequence("PAY", snapshot.sequences.payment),
        invoiceId,
        amount: subtotal,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber || null,
        notes: "Point of sale",
        paidAt: timestamp,
      },
    ],
    posSales: [
      ...snapshot.posSales,
      {
        id: crypto.randomUUID(),
        saleNumber: formatSequence("POS", snapshot.sequences.pos),
        invoiceId,
        customerId,
        totalAmount: subtotal,
        createdAt: timestamp,
      },
    ],
  };

  return nextSnapshot;
}

export function completePosCartRecord(
  snapshot: SandboxSnapshot,
  input: {
    customerId?: string;
    discount: number;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes: string;
    items: Array<{ productId: string; quantity: number }>;
  },
  now = new Date(),
) {
  const customerId =
    input.customerId ??
    snapshot.customers.find((item) => item.displayName === "Walk-in Counter")?.id ??
    snapshot.customers[0]?.id;
  if (!customerId || !snapshot.customers.some((item) => item.id === customerId)) {
    return { ok: false as const, message: "Choose a customer before completing the sale." };
  }

  const lines = input.items.map((item) => {
    const product = snapshot.products.find((entry) => entry.id === item.productId);
    return { item, product };
  });
  if (lines.some((line) => !line.product)) {
    return { ok: false as const, message: "One of the cart products is no longer in the catalog." };
  }
  const shortage = lines.find((line) => (line.product?.availableQuantity ?? 0) < line.item.quantity);
  if (shortage?.product) {
    return { ok: false as const, message: `Not enough stock for ${shortage.product.name}.` };
  }

  const subtotal = roundCurrency(
    lines.reduce((sum, line) => sum + line.item.quantity * (line.product?.sellingPrice ?? 0), 0),
  );
  const discount = roundCurrency(Math.min(Math.max(input.discount, 0), subtotal));
  const taxRate = Number(snapshot.business.defaultTaxRate) || 0;
  const tax = roundCurrency(Math.max(subtotal - discount, 0) * (taxRate / 100));
  const total = roundCurrency(Math.max(subtotal - discount, 0) + tax);
  if (input.paymentAmount + 0.0001 < total && !snapshot.business.allowPartialPayments) {
    return { ok: false as const, message: "Payment must cover the sale total." };
  }

  const paidAmount = roundCurrency(Math.min(input.paymentAmount, total));
  const balance = roundCurrency(total - paidAmount);
  const status = balance === 0 ? "paid" : "partially_paid";
  const timestamp = now.toISOString();
  const invoiceId = crypto.randomUUID();
  const invoiceDate = DateTime.fromJSDate(now).setZone("Asia/Manila").toISODate() ?? timestamp.slice(0, 10);
  let shop = ensureSandboxStockMovements(snapshot);
  const movements: SandboxStockMovement[] = [];
  const products = shop.products.map((product) => {
    const line = lines.find((entry) => entry.product?.id === product.id);
    if (!line) return product;
    const previousQuantity = product.availableQuantity;
    const newQuantity = roundCurrency(previousQuantity - line.item.quantity);
    movements.push({
      id: crypto.randomUUID(),
      productId: product.id,
      movementType: "pos_sale",
      quantity: line.item.quantity,
      previousQuantity,
      newQuantity,
      referenceType: "pos_sale",
      notes: input.notes || "Point of sale",
      createdAt: timestamp,
    });
    return { ...product, availableQuantity: newQuantity, updatedAt: timestamp };
  });

  shop = {
    ...shop,
    sequences: {
      ...shop.sequences,
      invoice: shop.sequences.invoice + 1,
      payment: shop.sequences.payment + 1,
      pos: shop.sequences.pos + 1,
    },
    products,
    stockMovements: [...movements, ...(shop.stockMovements ?? [])],
    invoices: [
      ...shop.invoices,
      {
        id: invoiceId,
        invoiceNumber: formatSequence("INV", shop.sequences.invoice),
        jobOrderId: null,
        customerId,
        vehicleId: null,
        source: "pos" as const,
        subtotal,
        discount,
        tax,
        totalAmount: total,
        paidAmount,
        balance,
        status,
        invoiceDate,
        createdAt: timestamp,
        cancellationReason: null,
      },
    ],
    invoiceLines: [
      ...shop.invoiceLines,
      ...lines.map((line) => ({
        id: crypto.randomUUID(),
        parentId: invoiceId,
        itemType: "product" as const,
        productId: line.product?.id ?? null,
        serviceId: null,
        description: line.product?.name ?? "Product",
        quantity: line.item.quantity,
        unitPrice: line.product?.sellingPrice ?? 0,
        total: roundCurrency(line.item.quantity * (line.product?.sellingPrice ?? 0)),
      })),
    ],
    payments: [
      ...shop.payments,
      {
        id: crypto.randomUUID(),
        paymentNumber: formatSequence("PAY", shop.sequences.payment),
        invoiceId,
        amount: paidAmount,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber || null,
        notes: input.notes || "Point of sale",
        paidAt: timestamp,
      },
    ],
    posSales: [
      ...shop.posSales,
      {
        id: crypto.randomUUID(),
        saleNumber: formatSequence("POS", shop.sequences.pos),
        invoiceId,
        customerId,
        totalAmount: total,
        createdAt: timestamp,
      },
    ],
  };

  return { ok: true as const, snapshot: shop, invoiceId };
}

export function createPayrollPeriodRecord(
  snapshot: SandboxSnapshot,
  values: {
    label: string;
    periodStartDate: string;
    periodEndDate: string;
    payoutDate: string;
    notes: string;
    applyGovernmentDeductions: boolean;
  },
  now = new Date(),
) {
  const parsed = payrollPeriodSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error };
  }

  const id = crypto.randomUUID();
  return {
    ok: true as const,
    id,
    snapshot: {
      ...snapshot,
      sequences: { ...snapshot.sequences, payroll: snapshot.sequences.payroll + 1 },
      payrollPeriods: [
        ...snapshot.payrollPeriods,
        {
          id,
          label: values.label,
          periodStartDate: values.periodStartDate,
          periodEndDate: values.periodEndDate,
          payoutDate: values.payoutDate,
          notes: values.notes || null,
          status: "draft" as const,
          applyGovernmentDeductions: values.applyGovernmentDeductions,
          generatedAt: null,
          finalizedAt: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ],
    },
  };
}

export function generatePayrollCutRecord(snapshot: SandboxSnapshot, periodId: string) {
  return generateSandboxPayrollCut(snapshot, periodId);
}

export function upsertAttendanceRecord(
  snapshot: SandboxSnapshot,
  input: {
    staffId: string;
    attendanceDate: string;
    status: SandboxSnapshot["attendance"][number]["status"];
    timeIn?: string | null;
    timeOut?: string | null;
    notes?: string | null;
  },
) {
  const lockedPeriod = sandboxPayrollLock(snapshot, input.attendanceDate);
  if (lockedPeriod) {
    throw new Error(
      lockedPeriod.status === "finalized"
        ? `Attendance is locked because payroll period ${lockedPeriod.label} is finalized.`
        : `Attendance is locked because payroll period ${lockedPeriod.label} is in processing.`,
    );
  }

  const existing = snapshot.attendance.find(
    (item) => item.staffId === input.staffId && item.attendanceDate === input.attendanceDate,
  );
  const nextRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    staffId: input.staffId,
    attendanceDate: input.attendanceDate,
    status: input.status,
    timeIn: input.timeIn === undefined ? existing?.timeIn ?? null : input.timeIn,
    timeOut: input.timeOut === undefined ? existing?.timeOut ?? null : input.timeOut,
    notes: input.notes === undefined ? existing?.notes ?? null : input.notes,
    approvedAt: new Date().toISOString(),
  };

  return {
    ...snapshot,
    attendance: existing
      ? snapshot.attendance.map((item) => (item.id === existing.id ? nextRecord : item))
      : [...snapshot.attendance, nextRecord],
  };
}

export function saveStaffScheduleRecord(
  snapshot: SandboxSnapshot,
  input: {
    staffId: string;
    shiftStartTime: string;
    shiftEndTime: string;
    graceMinutes: number;
    mondayIsWorkday: boolean;
    tuesdayIsWorkday: boolean;
    wednesdayIsWorkday: boolean;
    thursdayIsWorkday: boolean;
    fridayIsWorkday: boolean;
    saturdayIsWorkday: boolean;
    sundayIsWorkday: boolean;
    notes: string | null;
  },
) {
  const member = snapshot.staff.find((item) => item.id === input.staffId);
  if (!member) {
    throw new Error("Staff member was not found in the sample shop.");
  }

  return {
    ...snapshot,
    staff: snapshot.staff.map((item) =>
      item.id === input.staffId
        ? {
            ...item,
            schedule: {
              id: item.schedule?.id ?? crypto.randomUUID(),
              staffId: item.id,
              shiftStartTime: input.shiftStartTime,
              shiftEndTime: input.shiftEndTime,
              graceMinutes: input.graceMinutes,
              mondayIsWorkday: input.mondayIsWorkday,
              tuesdayIsWorkday: input.tuesdayIsWorkday,
              wednesdayIsWorkday: input.wednesdayIsWorkday,
              thursdayIsWorkday: input.thursdayIsWorkday,
              fridayIsWorkday: input.fridayIsWorkday,
              saturdayIsWorkday: input.saturdayIsWorkday,
              sundayIsWorkday: input.sundayIsWorkday,
              notes: input.notes,
            },
          }
        : item,
    ),
  };
}

export function normalizeSandboxDocument(document: {
  id: string;
  title: string;
  template?: string;
  contentJson?: unknown;
  status?: string;
  body?: string;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rootDocumentId?: string | null;
  parentDocumentId?: string | null;
  revisionNumber?: number;
  isCurrentRevision?: boolean;
  publishedAt?: string | null;
}): DocumentRecord {
  const updatedAt = document.updatedAt ?? document.createdAt ?? new Date().toISOString();
  const status =
    document.status === "saved" || document.status === "published"
      ? "published"
      : document.status === "archived"
        ? "archived"
        : "draft";

  return {
    id: document.id,
    title: document.title,
    template: document.template && isDocumentTemplateName(document.template) ? document.template : "blank",
    contentJson: document.contentJson ?? createLegacyDocumentJson(document.body),
    status,
    createdBy: document.createdBy ?? null,
    createdAt: document.createdAt ?? updatedAt,
    updatedAt,
    rootDocumentId: document.rootDocumentId ?? document.id,
    parentDocumentId: document.parentDocumentId ?? null,
    revisionNumber: document.revisionNumber ?? 1,
    isCurrentRevision: document.isCurrentRevision ?? true,
    publishedAt: document.publishedAt ?? (status === "published" ? updatedAt : null),
  };
}

type SandboxDocumentMutation =
  | { ok: true; document: DocumentRecord; snapshot: SandboxSnapshot }
  | { ok: false; message: string };

export function saveSandboxDocumentRecord(
  snapshot: SandboxSnapshot,
  input: SaveDocumentInput,
  now = new Date(),
): SandboxDocumentMutation {
  if (!isDocumentTemplateName(input.template)) {
    return { ok: false, message: "Unsupported document template." };
  }

  const contentJson = normalizeDocumentJson(input.contentJson);
  if (!isDocumentJson(contentJson)) {
    return { ok: false, message: "Document content must be valid TipTap JSON." };
  }

  const title = normalizeDocumentTitle(input.title, "Untitled document");
  const timestamp = now.toISOString();
  const existing = input.id
    ? snapshot.documents.map((item) => normalizeSandboxDocument(item)).find((item) => item.id === input.id)
    : undefined;

  if (input.id && !existing) {
    return { ok: false, message: "Document does not exist." };
  }

  if (existing?.status === "published") {
    return { ok: false, message: "Published documents cannot be edited. Create a revision instead." };
  }

  const document: DocumentRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    title,
    template: input.template,
    contentJson,
    status: input.status,
    createdBy: existing?.createdBy ?? null,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    rootDocumentId: existing?.rootDocumentId ?? existing?.id ?? null,
    parentDocumentId: existing?.parentDocumentId ?? null,
    revisionNumber: existing?.revisionNumber ?? 1,
    isCurrentRevision: existing?.isCurrentRevision ?? true,
    publishedAt: input.status === "published" ? existing?.publishedAt ?? timestamp : existing?.publishedAt ?? null,
  };

  if (!document.rootDocumentId) {
    document.rootDocumentId = document.id;
  }

  return {
    ok: true,
    document,
    snapshot: {
      ...snapshot,
      documents: existing
        ? snapshot.documents.map((item) => (item.id === document.id ? document : normalizeSandboxDocument(item)))
        : [...snapshot.documents.map((item) => normalizeSandboxDocument(item)), document],
    },
  };
}

export function duplicateSandboxDocumentRecord(snapshot: SandboxSnapshot, documentId: string, now = new Date()): SandboxDocumentMutation {
  const source = snapshot.documents.map((item) => normalizeSandboxDocument(item)).find((item) => item.id === documentId);
  if (!source) {
    return { ok: false, message: "Document does not exist." };
  }

  const timestamp = now.toISOString();
  const id = crypto.randomUUID();
  const document: DocumentRecord = {
    ...source,
    id,
    title: buildDuplicateDocumentTitle(source.title),
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    rootDocumentId: id,
    parentDocumentId: null,
    revisionNumber: 1,
    isCurrentRevision: true,
    publishedAt: null,
  };

  return {
    ok: true,
    document,
    snapshot: {
      ...snapshot,
      documents: [...snapshot.documents.map((item) => normalizeSandboxDocument(item)), document],
    },
  };
}

export function archiveSandboxDocumentRecord(snapshot: SandboxSnapshot, documentId: string, now = new Date()): SandboxDocumentMutation {
  const source = snapshot.documents.map((item) => normalizeSandboxDocument(item)).find((item) => item.id === documentId);
  if (!source) {
    return { ok: false, message: "Document does not exist." };
  }

  const document: DocumentRecord = {
    ...source,
    status: "archived",
    updatedAt: now.toISOString(),
  };

  return {
    ok: true,
    document,
    snapshot: {
      ...snapshot,
      documents: snapshot.documents.map((item) => (item.id === documentId ? document : normalizeSandboxDocument(item))),
    },
  };
}

export function deleteSandboxDocumentRecord(snapshot: SandboxSnapshot, documentId: string) {
  if (!snapshot.documents.some((item) => item.id === documentId)) {
    return { ok: false as const, message: "Document does not exist." };
  }

  return {
    ok: true as const,
    snapshot: {
      ...snapshot,
      documents: snapshot.documents.filter((item) => item.id !== documentId),
    },
  };
}

export function reviseSandboxDocumentRecord(snapshot: SandboxSnapshot, documentId: string, now = new Date()): SandboxDocumentMutation {
  const source = snapshot.documents.map((item) => normalizeSandboxDocument(item)).find((item) => item.id === documentId);
  if (!source) {
    return { ok: false, message: "Document does not exist." };
  }

  if (source.status !== "published") {
    return { ok: false, message: "Only published documents can be revised." };
  }

  const timestamp = now.toISOString();
  const id = crypto.randomUUID();
  const document: DocumentRecord = {
    ...source,
    id,
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    rootDocumentId: source.rootDocumentId ?? source.id,
    parentDocumentId: source.id,
    revisionNumber: source.revisionNumber + 1,
    isCurrentRevision: true,
    publishedAt: null,
  };

  return {
    ok: true,
    document,
    snapshot: {
      ...snapshot,
      documents: [
        ...snapshot.documents.map((item) =>
          item.id === source.id
            ? { ...normalizeSandboxDocument(item), isCurrentRevision: false }
            : normalizeSandboxDocument(item),
        ),
        document,
      ],
    },
  };
}

function createLegacyDocumentJson(body: string | undefined) {
  const text = body?.trim();
  if (!text) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

export function ensureSandboxTimekeeping(snapshot: SandboxSnapshot): SandboxSnapshot {
  const defaults = createSandboxTimekeepingDefaults("2026-10-10T01:00:00.000Z");

  return {
    ...snapshot,
    holidays: snapshot.holidays.map((holiday) => ({ ...holiday, notes: holiday.notes ?? null })),
    attendanceAccess: snapshot.attendanceAccess ?? defaults.attendanceAccess,
    allowedIps: snapshot.allowedIps ?? defaults.allowedIps,
    staffDevices: snapshot.staffDevices ?? defaults.staffDevices,
    dtrAmendments: snapshot.dtrAmendments ?? [],
  };
}

export function recordSandboxMechanicPunch(
  snapshot: SandboxSnapshot,
  logType: "time_in" | "time_out",
) {
  const shop = ensureSandboxTimekeeping(snapshot);
  const mechanic = shop.staff.find((member) => member.id === SANDBOX_IDS.mechanic);
  if (!mechanic) {
    return { ok: false as const, message: "The sample mechanic is not in this shop." };
  }

  const approvedDevice = (shop.staffDevices ?? []).find(
    (device) => device.staffId === mechanic.id && device.status === "approved",
  );
  if (!approvedDevice) {
    return {
      ok: false as const,
      message: "This device is not approved for time-in/time-out yet. Ask the owner or admin to approve it, or file a DTR amendment.",
    };
  }

  if (shop.attendanceAccess?.requireShopIpForMechanicAttendance) {
    const onShopNetwork = (shop.allowedIps ?? []).some((item) => item.ipAddress === SANDBOX_SHOP_PUBLIC_IP);
    if (!onShopNetwork) {
      return {
        ok: false as const,
        message: "You are not connected to the approved shop network. File a DTR amendment if this attendance needs admin review.",
      };
    }
  }

  const attendanceDate = getBusinessNow().toFormat("yyyy-LL-dd");
  const existing = shop.attendance.find(
    (item) => item.staffId === mechanic.id && item.attendanceDate === attendanceDate,
  );
  const nextLogType = !existing?.timeIn ? "time_in" : !existing.timeOut ? "time_out" : null;
  if (!nextLogType) {
    return {
      ok: false as const,
      message: "Today's attendance already has both time in and time out recorded.",
    };
  }
  if (logType !== nextLogType) {
    return {
      ok: false as const,
      message: `The next available action is ${nextLogType === "time_in" ? "Time In" : "Time Out"}.`,
    };
  }

  const loggedAt = getBusinessNow().toUTC().toISO() ?? new Date().toISOString();
  try {
    return {
      ok: true as const,
      snapshot: upsertAttendanceRecord(shop, {
        staffId: mechanic.id,
        attendanceDate,
        status:
          nextLogType === "time_in"
            ? deriveAttendanceStatusFromTimeIn({
                schedule: mechanic.schedule,
                timeInUtcIso: loggedAt,
              })
            : existing?.status ?? "present",
        timeIn: nextLogType === "time_in" ? loggedAt : existing?.timeIn,
        timeOut: nextLogType === "time_out" ? loggedAt : existing?.timeOut,
      }),
    };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Could not record attendance.",
    };
  }
}

export function submitSandboxDtrAmendment(
  snapshot: SandboxSnapshot,
  values: {
    attendanceDate: string;
    targetLogType: SandboxDtrAmendment["targetLogType"];
    amendmentType: SandboxDtrAmendment["amendmentType"];
    requestedTime: string;
    reason: string;
  },
) {
  const shop = ensureSandboxTimekeeping(snapshot);
  if (shop.attendanceAccess?.allowDtrAmendments === false) {
    return { ok: false as const, message: "DTR amendments are currently disabled for this branch." };
  }

  const lockedPeriod = sandboxPayrollLock(shop, values.attendanceDate);
  if (lockedPeriod) {
    return { ok: false as const, message: sandboxPayrollLockMessage(lockedPeriod) };
  }

  const amendments = shop.dtrAmendments ?? [];
  const duplicate = amendments.find(
    (item) =>
      item.staffId === SANDBOX_IDS.mechanic &&
      item.attendanceDate === values.attendanceDate &&
      item.targetLogType === values.targetLogType &&
      item.status === "pending",
  );
  if (duplicate) {
    return { ok: false as const, message: "A pending amendment already exists for that attendance action." };
  }

  const existing = shop.attendance.find(
    (item) => item.staffId === SANDBOX_IDS.mechanic && item.attendanceDate === values.attendanceDate,
  );
  if (
    values.amendmentType !== "wrong_time" &&
    ((values.targetLogType === "time_in" && existing?.timeIn) ||
      (values.targetLogType === "time_out" && existing?.timeOut))
  ) {
    return {
      ok: false as const,
      message: "That attendance time is already recorded. Use Wrong time if the timestamp needs correction.",
    };
  }

  const requestedTimestamp = toUtcIso(`${values.attendanceDate}T${values.requestedTime}`) ?? new Date().toISOString();
  const now = new Date().toISOString();
  const amendment: SandboxDtrAmendment = {
    id: crypto.randomUUID(),
    staffId: SANDBOX_IDS.mechanic,
    attendanceDate: values.attendanceDate,
    targetLogType: values.targetLogType,
    amendmentType: values.amendmentType,
    requestedTimestamp,
    reason: values.reason.trim(),
    status: "pending",
    requestedIp: SANDBOX_SHOP_PUBLIC_IP,
    approvedTimestamp: null,
    approvedByStaffId: null,
    rejectedAt: null,
    rejectedByStaffId: null,
    finalTimestamp: null,
    adminNote: null,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ok: true as const,
    snapshot: {
      ...shop,
      dtrAmendments: [amendment, ...amendments],
    },
  };
}

export function reviewSandboxDtrAmendment(
  snapshot: SandboxSnapshot,
  values: {
    amendmentId: string;
    decision: "approved" | "rejected";
    finalTime: string;
    adminNote: string;
  },
) {
  const shop = ensureSandboxTimekeeping(snapshot);
  const amendment = (shop.dtrAmendments ?? []).find((item) => item.id === values.amendmentId);
  if (!amendment) {
    return { ok: false as const, message: "Amendment request no longer exists." };
  }
  if (amendment.status !== "pending") {
    return { ok: false as const, message: "Only pending amendments can be reviewed." };
  }

  const lockedPeriod = sandboxPayrollLock(shop, amendment.attendanceDate);
  if (lockedPeriod) {
    return { ok: false as const, message: sandboxPayrollLockMessage(lockedPeriod) };
  }

  const reviewedAt = new Date().toISOString();
  const adminNote = values.adminNote.trim() || null;
  if (values.decision === "rejected") {
    return {
      ok: true as const,
      snapshot: {
        ...shop,
        dtrAmendments: (shop.dtrAmendments ?? []).map((item) =>
          item.id === amendment.id
            ? {
                ...item,
                status: "rejected" as const,
                rejectedAt: reviewedAt,
                rejectedByStaffId: SANDBOX_IDS.owner,
                adminNote,
                updatedAt: reviewedAt,
              }
            : item,
        ),
      },
    };
  }

  const finalTimestamp = toUtcIso(`${amendment.attendanceDate}T${values.finalTime}`) ?? reviewedAt;
  const mechanic = shop.staff.find((member) => member.id === amendment.staffId);
  const existing = shop.attendance.find(
    (item) => item.staffId === amendment.staffId && item.attendanceDate === amendment.attendanceDate,
  );
  const timeIn = amendment.targetLogType === "time_in" ? finalTimestamp : existing?.timeIn;
  const timeOut = amendment.targetLogType === "time_out" ? finalTimestamp : existing?.timeOut;

  let nextSnapshot: SandboxSnapshot;
  try {
    nextSnapshot = upsertAttendanceRecord(shop, {
      staffId: amendment.staffId,
      attendanceDate: amendment.attendanceDate,
      status: timeIn
        ? deriveAttendanceStatusFromTimeIn({
            schedule: mechanic?.schedule ?? null,
            timeInUtcIso: timeIn,
          })
        : existing?.status ?? "present",
      timeIn,
      timeOut,
    });
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Could not apply the amendment.",
    };
  }

  return {
    ok: true as const,
    snapshot: {
      ...nextSnapshot,
      dtrAmendments: (nextSnapshot.dtrAmendments ?? []).map((item) =>
        item.id === amendment.id
          ? {
              ...item,
              status: "approved" as const,
              approvedTimestamp: finalTimestamp,
              approvedByStaffId: SANDBOX_IDS.owner,
              finalTimestamp,
              adminNote,
              updatedAt: reviewedAt,
            }
          : item,
      ),
    },
  };
}

function sandboxPayrollLock(snapshot: SandboxSnapshot, attendanceDate: string) {
  return snapshot.payrollPeriods.find(
    (period) =>
      (period.status === "processing" || period.status === "finalized") &&
      attendanceDate >= period.periodStartDate &&
      attendanceDate <= period.periodEndDate,
  );
}

function sandboxPayrollLockMessage(period: SandboxSnapshot["payrollPeriods"][number]) {
  return period.status === "finalized"
    ? `That attendance date is locked because payroll period ${period.label} is finalized.`
    : `That attendance date is locked because payroll period ${period.label} is in processing.`;
}

export function upsertSandboxHoliday(
  snapshot: SandboxSnapshot,
  values: {
    holidayId: string;
    holidayDate: string;
    label: string;
    holidayKind: SandboxHoliday["holidayKind"];
    payTreatment: SandboxHoliday["payTreatment"];
    notes: string;
  },
) {
  const shop = ensureSandboxTimekeeping(snapshot);
  const duplicate = shop.holidays.find(
    (holiday) => holiday.holidayDate === values.holidayDate && holiday.id !== values.holidayId,
  );
  if (duplicate) {
    return { ok: false as const, message: "A branch calendar date already exists for that date." };
  }

  const notes = values.notes.trim() ? values.notes.trim() : null;
  const existing = values.holidayId
    ? shop.holidays.find((holiday) => holiday.id === values.holidayId)
    : undefined;
  if (values.holidayId && !existing) {
    return { ok: false as const, message: "Branch holiday not found." };
  }

  const holiday: SandboxHoliday = {
    id: existing?.id ?? crypto.randomUUID(),
    holidayDate: values.holidayDate,
    label: values.label.trim(),
    holidayKind: values.holidayKind,
    payTreatment: values.payTreatment,
    notes,
  };

  return {
    ok: true as const,
    snapshot: {
      ...shop,
      holidays: [...shop.holidays.filter((item) => item.id !== holiday.id), holiday].sort((left, right) =>
        left.holidayDate.localeCompare(right.holidayDate),
      ),
    },
  };
}

export function deleteSandboxHoliday(snapshot: SandboxSnapshot, holidayId: string) {
  const shop = ensureSandboxTimekeeping(snapshot);
  if (!shop.holidays.some((holiday) => holiday.id === holidayId)) {
    return shop;
  }

  return {
    ...shop,
    holidays: shop.holidays.filter((holiday) => holiday.id !== holidayId),
  };
}

export function importSandboxHolidays(
  snapshot: SandboxSnapshot,
  holidays: Array<Omit<SandboxHoliday, "id">>,
) {
  const shop = ensureSandboxTimekeeping(snapshot);
  const existingDates = new Set(shop.holidays.map((holiday) => holiday.holidayDate));
  const added = holidays
    .filter((holiday) => !existingDates.has(holiday.holidayDate))
    .map((holiday) => ({ ...holiday, id: crypto.randomUUID(), notes: holiday.notes ?? null }));

  return {
    importedCount: added.length,
    snapshot: {
      ...shop,
      holidays: [...shop.holidays, ...added].sort((left, right) =>
        left.holidayDate.localeCompare(right.holidayDate),
      ),
    },
  };
}

export function saveSandboxAttendanceAccess(snapshot: SandboxSnapshot, values: SandboxAttendanceAccess) {
  const shop = ensureSandboxTimekeeping(snapshot);
  const current = shop.attendanceAccess ?? values;

  return {
    ...shop,
    attendanceAccess: {
      ...values,
      geofenceLatitude: values.requireShopLocationForMechanicAttendance
        ? values.geofenceLatitude
        : current.geofenceLatitude,
      geofenceLongitude: values.requireShopLocationForMechanicAttendance
        ? values.geofenceLongitude
        : current.geofenceLongitude,
    },
  };
}

export function addSandboxAllowedIp(
  snapshot: SandboxSnapshot,
  values: { ipAddress: string; label: string },
  now = new Date(),
) {
  const shop = ensureSandboxTimekeeping(snapshot);
  const ipAddress = values.ipAddress.trim();
  if (shop.allowedIps?.some((item) => item.ipAddress === ipAddress)) {
    return { ok: false as const, message: "That public IP address is already approved." };
  }

  const timestamp = now.toISOString();
  return {
    ok: true as const,
    snapshot: {
      ...shop,
      allowedIps: [
        ...(shop.allowedIps ?? []),
        {
          id: crypto.randomUUID(),
          ipAddress,
          label: values.label.trim() || null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    },
  };
}

export function deleteSandboxAllowedIp(snapshot: SandboxSnapshot, allowedIpId: string) {
  const shop = ensureSandboxTimekeeping(snapshot);
  return {
    ...shop,
    allowedIps: (shop.allowedIps ?? []).filter((item) => item.id !== allowedIpId),
  };
}

export function approveSandboxStaffDevice(snapshot: SandboxSnapshot, deviceId: string, now = new Date()) {
  const shop = ensureSandboxTimekeeping(snapshot);
  const device = shop.staffDevices?.find((item) => item.id === deviceId);
  if (!device) return shop;

  const timestamp = now.toISOString();
  return {
    ...shop,
    staffDevices: (shop.staffDevices ?? []).map((item) => {
      if (item.id === device.id) {
        return { ...item, status: "approved" as const, approvedAt: timestamp, revokedAt: null, updatedAt: timestamp };
      }
      if (item.staffId === device.staffId && item.status === "approved") {
        return { ...item, status: "revoked" as const, revokedAt: timestamp, updatedAt: timestamp };
      }
      return item;
    }),
  };
}

export function revokeSandboxStaffDevice(snapshot: SandboxSnapshot, deviceId: string, now = new Date()) {
  const shop = ensureSandboxTimekeeping(snapshot);
  const timestamp = now.toISOString();
  return {
    ...shop,
    staffDevices: (shop.staffDevices ?? []).map((item) =>
      item.id === deviceId
        ? { ...item, status: "revoked" as const, revokedAt: timestamp, updatedAt: timestamp }
        : item,
    ),
  };
}

export function deleteSandboxStaffDevice(snapshot: SandboxSnapshot, deviceId: string) {
  const shop = ensureSandboxTimekeeping(snapshot);
  return {
    ...shop,
    staffDevices: (shop.staffDevices ?? []).filter((item) => item.id !== deviceId),
  };
}

export function formatSequence(prefix: string, value: number) {
  return `${prefix}-${String(value).padStart(4, "0")}`;
}
