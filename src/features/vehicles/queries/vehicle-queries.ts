import { cache } from "react";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";
import type { CustomerDocumentHistoryItem } from "@/features/customers/types";
import { mapVehicleDetail, mapVehicleRowToListItem } from "@/features/vehicles/mappers";
import type { VehicleDetail, VehicleListItem } from "@/features/vehicles/types";

type VehicleRow = TableRow<"vehicles">;
type CustomerRow = TableRow<"customers">;
type QuotationHistoryRow = Pick<
  TableRow<"quotations">,
  "id" | "quotation_number" | "vehicle_id" | "status" | "total_amount" | "created_at"
>;
type JobOrderHistoryRow = Pick<
  TableRow<"job_orders">,
  "id" | "quotation_id" | "job_order_number" | "vehicle_id" | "status" | "created_at"
>;
type InvoiceHistoryRow = Pick<
  TableRow<"invoices">,
  "id" | "job_order_id" | "invoice_number" | "vehicle_id" | "status" | "total_amount" | "invoice_date"
>;
type PaymentHistoryRow = Pick<
  TableRow<"payments">,
  "id" | "invoice_id" | "amount" | "payment_method" | "reference_number" | "paid_at"
>;

export async function listVehicles(filters?: {
  search?: string;
  customerId?: string;
}): Promise<VehicleListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:read");
  let query = applyBranchFilter(
    supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
    branchScope.selectedBranchId,
  );

  if (filters?.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    query = query.or(
      `make.ilike.%${escapedSearch}%,model.ilike.%${escapedSearch}%,plate_number.ilike.%${escapedSearch}%,vin.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const vehicles = (data ?? []) satisfies VehicleRow[];
  const customerIds = [...new Set(vehicles.map((vehicle) => vehicle.customer_id))];
  const customerNames = await getCustomerNameMap(customerIds);

  return vehicles.map((vehicle) =>
    mapVehicleRowToListItem(vehicle, customerNames.get(vehicle.customer_id) ?? "Unknown customer"),
  );
}

export const getVehicleById = cache(async (vehicleId: string): Promise<VehicleDetail | null> => {
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:read");
  const { data, error } = await applyBranchFilter(
    supabase.from("vehicles").select("*"),
    branchScope.selectedBranchId,
  )
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const vehicle = data satisfies VehicleRow;
  const customerNames = await getCustomerNameMap([vehicle.customer_id]);

  return mapVehicleDetail(vehicle, customerNames.get(vehicle.customer_id) ?? "Unknown customer");
});

export async function listDocumentHistoryByVehicleId(
  vehicleId: string,
): Promise<CustomerDocumentHistoryItem[]> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("vehicles:read");
  const canViewQuotations = context.capabilities.includes("quotations:read");
  const canViewJobOrders = context.capabilities.includes("job_orders:read");
  const canViewInvoices = context.capabilities.includes("invoices:read");
  const canViewPayments = context.capabilities.includes("payments:read");

  const [
    { data: vehicle, error: vehicleError },
    { data: quotations, error: quotationsError },
    { data: jobOrders, error: jobOrdersError },
    { data: invoices, error: invoicesError },
  ] = await Promise.all([
    applyBranchFilter(
      supabase.from("vehicles").select("*").eq("id", vehicleId),
      branchScope.selectedBranchId,
    ).maybeSingle(),
    canViewQuotations
      ? applyBranchFilter(
          supabase
            .from("quotations")
            .select("id, quotation_number, vehicle_id, status, total_amount, created_at")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false }),
          branchScope.selectedBranchId,
        )
      : Promise.resolve({ data: [], error: null }),
    canViewJobOrders
      ? applyBranchFilter(
          supabase
            .from("job_orders")
            .select("id, quotation_id, job_order_number, vehicle_id, status, created_at")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false }),
          branchScope.selectedBranchId,
        )
      : Promise.resolve({ data: [], error: null }),
    canViewInvoices || canViewPayments
      ? applyBranchFilter(
          supabase
            .from("invoices")
            .select("id, job_order_id, invoice_number, vehicle_id, status, total_amount, invoice_date")
            .eq("vehicle_id", vehicleId)
            .order("invoice_date", { ascending: false }),
          branchScope.selectedBranchId,
        )
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (vehicleError) {
    throw new Error(vehicleError.message);
  }

  if (quotationsError) {
    throw new Error(quotationsError.message);
  }

  if (jobOrdersError) {
    throw new Error(jobOrdersError.message);
  }

  if (invoicesError) {
    throw new Error(invoicesError.message);
  }

  if (!vehicle) {
    return [];
  }

  const vehicleRow = vehicle satisfies VehicleRow;
  const quotationRows = (quotations ?? []) as QuotationHistoryRow[];
  const jobOrderRows = (jobOrders ?? []) as JobOrderHistoryRow[];
  const invoiceRows = (invoices ?? []) as InvoiceHistoryRow[];

  const { data: payments, error: paymentsError } =
    canViewPayments && invoiceRows.length > 0
      ? await applyBranchFilter(
          supabase
            .from("payments")
            .select("id, invoice_id, amount, payment_method, reference_number, paid_at")
            .in(
              "invoice_id",
              invoiceRows.map((invoice) => invoice.id),
            )
            .order("paid_at", { ascending: false }),
          branchScope.selectedBranchId,
        )
      : { data: [], error: null };

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }

  return buildVehicleDocumentHistory({
    vehicle: vehicleRow,
    quotations: quotationRows,
    jobOrders: jobOrderRows,
    invoices: canViewInvoices ? invoiceRows : [],
    payments: (payments ?? []) as PaymentHistoryRow[],
    canViewQuotations,
    canViewJobOrders,
    canViewInvoices,
  });
}

async function getCustomerNameMap(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, display_name")
    .in("id", customerIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as Pick<CustomerRow, "id" | "display_name">[]).map((customer) => [
      customer.id,
      customer.display_name,
    ]),
  );
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}

function buildVehicleDocumentHistory(params: {
  vehicle: VehicleRow;
  quotations: QuotationHistoryRow[];
  jobOrders: JobOrderHistoryRow[];
  invoices: InvoiceHistoryRow[];
  payments: PaymentHistoryRow[];
  canViewQuotations: boolean;
  canViewJobOrders: boolean;
  canViewInvoices: boolean;
}): CustomerDocumentHistoryItem[] {
  const vehicleLabel = formatVehicleLabel(params.vehicle);
  const jobOrderByQuotationId = new Map(
    params.jobOrders
      .filter((jobOrder) => jobOrder.quotation_id)
      .map((jobOrder) => [jobOrder.quotation_id as string, jobOrder]),
  );
  const invoiceByJobOrderId = new Map(
    params.invoices
      .filter((invoice) => invoice.job_order_id)
      .map((invoice) => [invoice.job_order_id as string, invoice]),
  );
  const invoiceById = new Map(params.invoices.map((invoice) => [invoice.id, invoice]));

  const history: CustomerDocumentHistoryItem[] = [
    ...params.quotations.map((quotation) => ({
      id: quotation.id,
      documentType: "quotation" as const,
      documentLabel: quotation.quotation_number,
      documentHref: `/quotations/${quotation.id}`,
      vehicleLabel,
      occurredAt: quotation.created_at,
      amount: quotation.total_amount,
      status: quotation.status,
      linkedRecords:
        params.canViewJobOrders && jobOrderByQuotationId.has(quotation.id)
          ? [
              {
                label: jobOrderByQuotationId.get(quotation.id)?.job_order_number ?? "Job order",
                href: `/job-orders/${jobOrderByQuotationId.get(quotation.id)?.id}`,
              },
            ]
          : [],
    })),
    ...params.jobOrders.map((jobOrder) => {
      const linkedRecords = [];

      if (params.canViewQuotations && jobOrder.quotation_id) {
        const linkedQuotation = params.quotations.find((quotation) => quotation.id === jobOrder.quotation_id);

        if (linkedQuotation) {
          linkedRecords.push({
            label: linkedQuotation.quotation_number,
            href: `/quotations/${linkedQuotation.id}`,
          });
        }
      }

      if (params.canViewInvoices) {
        const linkedInvoice = invoiceByJobOrderId.get(jobOrder.id);

        if (linkedInvoice) {
          linkedRecords.push({
            label: linkedInvoice.invoice_number,
            href: `/invoices/${linkedInvoice.id}`,
          });
        }
      }

      return {
        id: jobOrder.id,
        documentType: "job_order" as const,
        documentLabel: jobOrder.job_order_number,
        documentHref: `/job-orders/${jobOrder.id}`,
        vehicleLabel,
        occurredAt: jobOrder.created_at,
        amount: null,
        status: jobOrder.status,
        linkedRecords,
      };
    }),
    ...params.invoices.map((invoice) => {
      const linkedRecords = [];

      if (params.canViewJobOrders && invoice.job_order_id) {
        const linkedJobOrder = params.jobOrders.find((jobOrder) => jobOrder.id === invoice.job_order_id);

        if (linkedJobOrder) {
          linkedRecords.push({
            label: linkedJobOrder.job_order_number,
            href: `/job-orders/${linkedJobOrder.id}`,
          });
        }
      }

      return {
        id: invoice.id,
        documentType: "invoice" as const,
        documentLabel: invoice.invoice_number,
        documentHref: `/invoices/${invoice.id}`,
        vehicleLabel,
        occurredAt: invoice.invoice_date,
        amount: invoice.total_amount,
        status: invoice.status,
        linkedRecords,
      };
    }),
    ...params.payments.map((payment) => {
      const linkedRecords = [];
      const linkedInvoice = invoiceById.get(payment.invoice_id);

      if (params.canViewInvoices && linkedInvoice) {
        linkedRecords.push({
          label: linkedInvoice.invoice_number,
          href: `/invoices/${linkedInvoice.id}`,
        });
      }

      if (params.canViewJobOrders && linkedInvoice?.job_order_id) {
        const linkedJobOrder = params.jobOrders.find((jobOrder) => jobOrder.id === linkedInvoice.job_order_id);

        if (linkedJobOrder) {
          linkedRecords.push({
            label: linkedJobOrder.job_order_number,
            href: `/job-orders/${linkedJobOrder.id}`,
          });
        }
      }

      return {
        id: payment.id,
        documentType: "payment" as const,
        documentLabel: payment.reference_number?.trim() || "Payment record",
        documentHref: `/payments/${payment.id}`,
        vehicleLabel,
        occurredAt: payment.paid_at,
        amount: payment.amount,
        paymentMethod: payment.payment_method,
        linkedRecords,
      };
    }),
  ];

  return history.sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
}

function formatVehicleLabel(vehicle: Pick<VehicleRow, "make" | "model" | "year" | "plate_number">) {
  const platePart = vehicle.plate_number ? ` · ${vehicle.plate_number}` : "";
  const yearPart = vehicle.year ? ` (${vehicle.year})` : "";
  return `${vehicle.make} ${vehicle.model}${yearPart}${platePart}`;
}
