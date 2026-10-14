import { DateTime } from "luxon";

import { deriveCustomerDisplayName } from "@/features/customers/schemas/customer-form-schema";
import type { CustomerFormValues } from "@/features/customers/types";
import { recordInvoicePaymentSchema } from "@/features/invoices/schemas/invoice-forms";
import type { PaymentMethod } from "@/features/invoices/types";
import { jobOrderDetailsSchema, jobOrderStatusTransitionSchema } from "@/features/job-orders/schemas/job-order-forms";
import type { JobOrderStatus } from "@/features/job-orders/types";
import { computePayrollItem } from "@/features/payroll/calculations";
import { payrollPeriodSchema } from "@/features/payroll/schemas/payroll-schemas";
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
import type {
  SandboxBusiness,
  SandboxCustomer,
  SandboxLine,
  SandboxSnapshot,
} from "@/features/sandbox/types";

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

  const lines = snapshot.jobOrderLines.filter((item) => item.parentId === jobOrderId);
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

export function receiveStockRecord(snapshot: SandboxSnapshot, productId: string, quantity: number) {
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  return {
    ...snapshot,
    products: snapshot.products.map((item) =>
      item.id === productId
        ? { ...item, availableQuantity: roundCurrency(item.availableQuantity + quantity) }
        : item,
    ),
  };
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
          createdAt: now.toISOString(),
        },
      ],
    },
  };
}

export function generatePayrollCutRecord(snapshot: SandboxSnapshot, periodId: string) {
  const period = snapshot.payrollPeriods.find((item) => item.id === periodId);
  if (!period) {
    throw new Error("Payroll period not found.");
  }

  const items = snapshot.staff
    .filter((member) => member.isPayrollEligible && member.status === "active")
    .map((member) => {
      const computed = computePayrollItem({
        staffId: member.id,
        fullName: `${member.firstName} ${member.lastName}`.trim(),
        role: member.role,
        schedule: member.schedule,
        compensationProfile: member.compensation
          ? {
              id: `${member.id}-compensation`,
              staffId: member.id,
              payBasis: member.compensation.payBasis,
              baseRate: member.compensation.baseRate,
              overtimeRate: member.compensation.overtimeRate,
              allowancePerPeriod: member.compensation.allowancePerPeriod,
              effectiveStartDate: member.compensation.effectiveStartDate,
              exemptFromAttendance: member.compensation.exemptFromAttendance,
              useShopDefaultContributions: true,
              sssAmount: null,
              philhealthAmount: null,
              pagibigAmount: null,
              notes: null,
            }
          : null,
        attendanceRecords: snapshot.attendance
          .filter((record) => record.staffId === member.id)
          .map((record) => ({
            attendanceDate: record.attendanceDate,
            status: record.status,
            timeIn: record.timeIn,
            timeOut: record.timeOut,
            approvedAt: record.approvedAt,
          })),
        holidays: snapshot.holidays,
        leaveEntries: [],
        periodStartDate: period.periodStartDate,
        periodEndDate: period.periodEndDate,
        settings: {
          standardDailyHours: Number(snapshot.business.payrollStandardDailyHours) || 8,
          holidayPremiumRate: Number(snapshot.business.payrollHolidayPremiumRate) || 0,
        },
      });

      return {
        id: crypto.randomUUID(),
        periodId,
        staffId: member.id,
        fullName: computed.fullName,
        role: member.role,
        netPay: computed.netPay,
        grossPay: computed.grossPay,
        basePay: computed.basePay,
        presentCount: computed.presentCount,
        warningCodes: computed.warningCodes,
      };
    });

  return {
    ...snapshot,
    payrollPeriods: snapshot.payrollPeriods.map((item) =>
      item.id === periodId ? { ...item, status: "processing" as const } : item,
    ),
    payrollItems: [...snapshot.payrollItems.filter((item) => item.periodId !== periodId), ...items],
  };
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
  const lockedPeriod = snapshot.payrollPeriods.find(
    (period) =>
      (period.status === "processing" || period.status === "finalized") &&
      input.attendanceDate >= period.periodStartDate &&
      input.attendanceDate <= period.periodEndDate,
  );
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

export function formatSequence(prefix: string, value: number) {
  return `${prefix}-${String(value).padStart(4, "0")}`;
}
