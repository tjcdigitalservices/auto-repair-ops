"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions, PagePrimaryAction } from "@/components/shared/page-header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendancePageContent } from "@/features/attendance/components/attendance-page-content";
import { CustomerDetailPageContent } from "@/features/customers/components/customer-detail-page-content";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { CustomersPageView } from "@/features/customers/components/customers-page-view";
import { DashboardHome } from "@/features/dashboard/components/dashboard-home";
import { PAYMENT_METHOD_OPTIONS } from "@/features/invoices/types";
import { ProductForm } from "@/features/products/components/product-form";
import { QuotationCreateFlow } from "@/features/quotations/components/quotation-create-flow";
import { QuotationDetailPageContent } from "@/features/quotations/components/quotation-detail-page-content";
import { QuotationForm } from "@/features/quotations/components/quotation-form";
import { QuotationsPageView } from "@/features/quotations/components/quotations-page-view";
import { BusinessProfileForm } from "@/features/settings/components/business-profile-form";
import { ServiceForm } from "@/features/services/components/service-form";
import { StaffForm } from "@/features/staff/components/staff-form";
import { SupplierForm } from "@/features/suppliers/components/supplier-form";
import { VehicleForm } from "@/features/vehicles/components/vehicle-form";
import { stripSandboxBasePath } from "@/features/sandbox/constants";
import {
  completePosSaleRecord,
  createInvoiceFromJobOrderRecord,
  createPayrollPeriodRecord,
  customerName,
  generatePayrollCutRecord,
  receiveStockRecord,
  recordPartUsageRecord,
  recordPaymentRecord,
  saveJobOrderDetailsRecord,
  updateJobOrderStatusRecord,
  vehicleLabel,
} from "@/features/sandbox/records";
import { updateSandboxShop } from "@/features/sandbox/store";
import type { SandboxSnapshot } from "@/features/sandbox/types";
import {
  filterSandboxQuotations,
  isQuotationStatusFilter,
  toAttendancePageData,
  toCustomerDetail,
  toCustomerListItem,
  toDashboardData,
  toQuotationCreateFlowOptions,
  toQuotationDetail,
  toQuotationFormOptions,
  toQuotationReviseState,
} from "@/features/sandbox/view-models";
import { createQuotationItem, resolveQuotationCreateFlowSelection } from "@/features/quotations/utils";
import { mapQuotationDetailToFormValues } from "@/features/quotations/mappers";
import { formatCurrency, formatMoneyInputValue } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { SANDBOX_IDS } from "@/features/sandbox/ids";

export function SandboxRouter({ snapshot }: { snapshot: SandboxSnapshot }) {
  const path = stripSandboxBasePath(usePathname());
  const searchParams = useSearchParams();
  const segments = path.split("/").filter(Boolean);
  const [section, id, action, extra] = segments;

  if (path.endsWith("/print")) {
    return <PrintScreen snapshot={snapshot} path={path} />;
  }

  if (section === "dashboard" || segments.length === 0) {
    return <DashboardHome dashboard={toDashboardData(snapshot)} />;
  }

  if (section === "customers") {
    return <CustomersScreen snapshot={snapshot} id={id} action={action} searchParams={searchParams} />;
  }
  if (section === "vehicles") {
    return <VehiclesScreen snapshot={snapshot} id={id} action={action} extra={extra} searchParams={searchParams} />;
  }
  if (section === "quotations") {
    return <QuotationsScreen snapshot={snapshot} id={id} action={action} searchParams={searchParams} />;
  }
  if (section === "job-orders") {
    return <JobOrdersScreen snapshot={snapshot} id={id} />;
  }
  if (section === "products") {
    return <ProductsScreen snapshot={snapshot} id={id} action={action} />;
  }
  if (section === "services") {
    return <ServicesScreen snapshot={snapshot} id={id} action={action} />;
  }
  if (section === "suppliers") {
    return <SuppliersScreen snapshot={snapshot} id={id} action={action} />;
  }
  if (section === "inventory") {
    return <InventoryScreen snapshot={snapshot} />;
  }
  if (section === "invoices") {
    return <InvoicesScreen snapshot={snapshot} id={id} />;
  }
  if (section === "payments") {
    return <PaymentsScreen snapshot={snapshot} id={id} />;
  }
  if (section === "pos") {
    return <PosScreen snapshot={snapshot} />;
  }
  if (section === "staff") {
    return <StaffScreen snapshot={snapshot} id={id} action={action} />;
  }
  if (section === "attendance") {
    return <AttendanceScreen snapshot={snapshot} id={id} searchParams={searchParams} />;
  }
  if (section === "payroll") {
    return <PayrollScreen snapshot={snapshot} id={id} />;
  }
  if (section === "reports") {
    return <ReportsScreen snapshot={snapshot} />;
  }
  if (section === "documents") {
    return <DocumentsScreen snapshot={snapshot} id={id} />;
  }
  if (section === "settings") {
    return <SettingsScreen snapshot={snapshot} id={id} action={action} extra={extra} />;
  }
  if (section === "quick-access") {
    return <QuickAccessScreen snapshot={snapshot} />;
  }

  return (
    <PageHeader
      title="Page not in the sample shop"
      description="Use the sidebar to open a workshop screen. This sandbox keeps every change in this browser."
    />
  );
}

function CustomersScreen({
  snapshot,
  id,
  action,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  action?: string;
  searchParams: URLSearchParams;
}) {
  if (id === "new") {
    return (
      <div className="space-y-6">
        <PageHeader title="New Customer" description="Create a customer in this browser only." backHref="/customers" backLabel="Back to customers" />
        <CustomerForm mode="create" initialValues={emptyCustomer()} />
      </div>
    );
  }

  if (id && action === "edit") {
    const customer = snapshot.customers.find((item) => item.id === id);
    if (!customer) return <Missing title="Customer" />;
    return (
      <div className="space-y-6">
        <PageHeader title={`Edit ${customer.displayName}`} description="Updates stay in this browser." backHref={`/customers/${customer.id}`} backLabel="Back to customer" />
        <CustomerForm
          mode="edit"
          initialValues={{
            customerId: customer.id,
            customerType: customer.customerType,
            firstName: customer.firstName ?? "",
            lastName: customer.lastName ?? "",
            companyName: customer.companyName ?? "",
            contactNumber: customer.contactNumber ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
            notes: customer.notes ?? "",
            status: customer.status,
          }}
        />
      </div>
    );
  }

  if (id) {
    const customer = toCustomerDetail(snapshot, id);
    if (!customer) return <Missing title="Customer" />;
    return (
      <CustomerDetailPageContent
        customer={customer}
        serviceHistory={[]}
        canViewServiceHistory
        canCreateQuotations
      />
    );
  }

  const search = searchParams.get("search") ?? "";
  const customers = snapshot.customers
    .filter((item) => {
      const haystack = `${item.displayName} ${item.contactNumber ?? ""} ${item.email ?? ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .map(toCustomerListItem);

  return (
    <CustomersPageView
      customers={customers}
      search={search}
      page={searchParams.get("page") ?? undefined}
      error={searchParams.get("error") ?? undefined}
      canManageCustomers
    />
  );
}

function VehiclesScreen({
  snapshot,
  id,
  action,
  extra,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  action?: string;
  extra?: string;
  searchParams: URLSearchParams;
}) {
  const lookupData = lookupDataFrom(snapshot);
  const customerOptions = snapshot.customers.map((item) => ({ id: item.id, label: item.displayName }));

  if (id === "new" || (action === "edit" && id) || extra === "new") {
    const vehicle = snapshot.vehicles.find((item) => item.id === id);
    return (
      <div className="space-y-6">
        <PageHeader
          title={vehicle ? `Edit ${vehicle.make} ${vehicle.model}` : "New Vehicle"}
          description="Vehicle records stay in this browser."
          backHref="/vehicles"
          backLabel="Back to vehicles"
        />
        <VehicleForm
          mode={vehicle ? "edit" : "create"}
          customerOptions={customerOptions}
          lookupData={lookupData}
          initialValues={
            vehicle
              ? {
                  vehicleId: vehicle.id,
                  customerId: vehicle.customerId,
                  make: vehicle.make,
                  model: vehicle.model,
                  year: vehicle.year ? String(vehicle.year) : "",
                  transmission: vehicle.transmission ?? "",
                  mileage: vehicle.mileage ? String(vehicle.mileage) : "",
                  plateNumber: vehicle.plateNumber ?? "",
                  vin: vehicle.vin ?? "",
                  engineSize: vehicle.engineSize ?? "",
                  variant: vehicle.variant ?? "",
                  fuelType: vehicle.fuelType ?? "",
                  color: vehicle.color ?? "",
                  status: vehicle.status,
                }
              : {
                  customerId: searchParams.get("customerId") ?? "",
                  make: "",
                  model: "",
                  year: "",
                  transmission: "",
                  mileage: "",
                  plateNumber: searchParams.get("plateNumber") ?? "",
                  vin: "",
                  engineSize: "",
                  variant: "",
                  fuelType: "",
                  color: "",
                  status: "active",
                }
          }
        />
      </div>
    );
  }

  if (id) {
    const vehicle = snapshot.vehicles.find((item) => item.id === id);
    if (!vehicle) return <Missing title="Vehicle" />;
    return (
      <RecordDetail
        title={`${vehicle.year ?? ""} ${vehicle.make} ${vehicle.model}`.trim()}
        subtitle={customerName(snapshot, vehicle.customerId)}
        backHref="/vehicles"
        editHref={`/vehicles/${vehicle.id}/edit`}
        rows={[
          ["Plate", vehicle.plateNumber],
          ["VIN", vehicle.vin],
          ["Mileage", vehicle.mileage ? String(vehicle.mileage) : null],
          ["Transmission", vehicle.transmission],
          ["Fuel", vehicle.fuelType],
          ["Color", vehicle.color],
        ]}
      />
    );
  }

  return (
    <ListScreen
      title="Vehicles"
      description="Vehicle records linked to customers."
      actionHref="/vehicles/new"
      actionLabel="New Vehicle"
      columns={["Vehicle", "Customer", "Plate", "Status"]}
      rows={snapshot.vehicles.map((vehicle) => ({
        href: `/vehicles/${vehicle.id}`,
        cells: [
          `${vehicle.year ?? ""} ${vehicle.make} ${vehicle.model}`.trim(),
          customerName(snapshot, vehicle.customerId),
          vehicle.plateNumber ?? "—",
          vehicle.status,
        ],
      }))}
    />
  );
}

function QuotationsScreen({
  snapshot,
  id,
  action,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  action?: string;
  searchParams: URLSearchParams;
}) {
  const options = toQuotationFormOptions(snapshot);

  if (id === "website-requests") {
    return (
      <ListScreen
        title="Website requests"
        description="Quote requests saved with the sample shop."
        columns={["Customer", "Vehicle", "Concern", "Status"]}
        rows={snapshot.quoteRequests.map((request) => ({
          href: "/quotations/website-requests",
          cells: [request.customerName, request.vehicle, request.concern, request.status],
        }))}
      />
    );
  }

  if (id === "new") {
    const flowOptions = toQuotationCreateFlowOptions(snapshot);
    const selection = resolveQuotationCreateFlowSelection({
      requestedCustomerId: searchParams.get("customerId") ?? undefined,
      requestedVehicleId: searchParams.get("vehicleId") ?? undefined,
      customers: flowOptions.customers,
      vehicles: flowOptions.vehicles,
    });

    return (
      <div className="space-y-6">
        <PageHeader
          title="New Quotation"
          description="Guided intake keeps customer and vehicle setup inside the quotation flow before you build the estimate."
        />
        <QuotationCreateFlow
          options={flowOptions}
          prefillLastName={searchParams.get("lastName")?.trim() ?? ""}
          initialValues={{
            customerId: selection.customerId,
            vehicleId: selection.vehicleId,
            natureOfRepair: "",
            inspectionNotes: "",
            status: "pending_approval",
            discount: formatMoneyInputValue(0),
            tax: formatMoneyInputValue(0),
            items: [createQuotationItem()],
          }}
        />
      </div>
    );
  }

  if (action === "edit" && id) {
    const quotation = toQuotationDetail(snapshot, id);
    if (!quotation || quotation.status === "approved") return <Missing title="Quotation" />;

    return (
      <div className="space-y-6">
        <PageHeader
          backHref={`/quotations/${id}`}
          backLabel="Back to quotation"
          title="Edit Quotation"
          description={
            <div className="space-y-1.5">
              <p className="font-medium text-foreground">{quotation.quotationNumber}</p>
              <p>
                {quotation.customerName} · {quotation.vehicleLabel}
              </p>
              <p className="pt-1">Update this draft quotation before approval.</p>
            </div>
          }
        />
        <QuotationForm mode="edit" options={options} initialValues={mapQuotationDetailToFormValues(quotation)} />
      </div>
    );
  }

  if (action === "revise" && id) {
    const revise = toQuotationReviseState(snapshot, id);
    if (!revise) return <Missing title="Quotation" />;
    if (!revise.canRevise) {
      return (
        <div className="space-y-6">
          <PageHeader
            title={`Revise ${revise.quotation.quotationNumber}`}
            description="This approved quotation cannot be revised in its current state."
          />
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {revise.blockReason ?? "Revise is not available for this quotation."}
          </div>
          <Button asChild variant="outline">
            <Link href={`/quotations/${id}`}>Back to quotation</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader
          backHref={`/quotations/${id}`}
          backLabel="Back to quotation"
          title={`Revise ${revise.quotation.quotationNumber}`}
          description={
            <div className="space-y-1.5">
              <p>
                {revise.quotation.customerName} · {revise.quotation.vehicleLabel}
              </p>
              <p className="pt-1">
                The linked job order is the operational source of truth. Saving synchronizes line items, prices, and totals with the customer-facing quotation.
              </p>
            </div>
          }
        />
        <QuotationForm mode="revise" options={options} initialValues={revise.initialValues} />
      </div>
    );
  }

  if (id) {
    const quotation = toQuotationDetail(snapshot, id);
    if (!quotation) return <Missing title="Quotation" />;
    const jobOrder = snapshot.jobOrders.find((item) => item.id === quotation.jobOrderId);
    const invoice = jobOrder
      ? snapshot.invoices.find((item) => item.jobOrderId === jobOrder.id)
      : undefined;

    return (
      <QuotationDetailPageContent
        quotation={quotation}
        relatedDocuments={[
          ...(jobOrder
            ? [{
                id: jobOrder.id,
                documentType: "job_order" as const,
                documentLabel: jobOrder.jobOrderNumber,
                documentHref: `/job-orders/${jobOrder.id}`,
                status: jobOrder.status,
                occurredAt: jobOrder.createdAt,
              }]
            : []),
          ...(invoice
            ? [{
                id: invoice.id,
                documentType: "invoice" as const,
                documentLabel: invoice.invoiceNumber,
                documentHref: `/invoices/${invoice.id}`,
                status: invoice.status,
                occurredAt: invoice.createdAt,
              }]
            : []),
        ]}
        revisionHistory={[]}
        canEdit={quotation.status === "draft" || quotation.status === "pending_approval"}
        canApprove={quotation.status === "draft" || quotation.status === "pending_approval"}
        canDelete={quotation.status !== "approved" && !quotation.jobOrderId}
      />
    );
  }

  const statusParam = searchParams.get("status") ?? "";
  const status = isQuotationStatusFilter(statusParam) ? statusParam : "";

  return (
    <QuotationsPageView
      quotations={filterSandboxQuotations(snapshot, searchParams.get("search") ?? "", status)}
      search={searchParams.get("search") ?? ""}
      status={status}
      page={searchParams.get("page") ?? undefined}
      branch={{ id: snapshot.branch.id, name: snapshot.branch.name, code: snapshot.branch.code }}
    />
  );
}

function JobOrdersScreen({ snapshot, id }: { snapshot: SandboxSnapshot; id?: string }) {
  if (!id) {
    return (
      <ListScreen
        title="Job Orders"
        description="Live workshop execution."
        columns={["Job order", "Customer", "Vehicle", "Status"]}
        rows={snapshot.jobOrders.map((item) => ({
          href: `/job-orders/${item.id}`,
          cells: [item.jobOrderNumber, customerName(snapshot, item.customerId), vehicleLabel(snapshot, item.vehicleId), item.status.replaceAll("_", " ")],
        }))}
      />
    );
  }

  const jobOrder = snapshot.jobOrders.find((item) => item.id === id);
  if (!jobOrder) return <Missing title="Job order" />;
  const lines = snapshot.jobOrderLines.filter((item) => item.parentId === jobOrder.id);
  const invoice = snapshot.invoices.find((item) => item.jobOrderId === jobOrder.id && item.status !== "cancelled");

  return (
    <div className="space-y-6">
      <PageHeader
        title={jobOrder.jobOrderNumber}
        description={`${customerName(snapshot, jobOrder.customerId)} · ${vehicleLabel(snapshot, jobOrder.vehicleId)}`}
        backHref="/job-orders"
        backLabel="Back to job orders"
      />
      <SectionCard title="Status" description="Moves the job through the workshop.">
        <NativeSelect
          value={jobOrder.status}
          onChange={(event) =>
            void updateSandboxShop((current) =>
              updateJobOrderStatusRecord(current, jobOrder.id, event.target.value as SandboxSnapshot["jobOrders"][number]["status"]),
            )
          }
        >
          {["pending", "in_progress", "waiting_for_parts", "completed", "ready_for_billing", "paid", "released", "cancelled"].map((status) => (
            <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
          ))}
        </NativeSelect>
      </SectionCard>
      <SectionCard title="Work" description="Concern, diagnosis, and mileage.">
        <JobDetailsForm snapshot={snapshot} jobOrder={jobOrder} />
      </SectionCard>
      <SectionCard title="Lines" description="Quoted work copied onto the job.">
        <LineTable lines={lines} />
      </SectionCard>
      <SectionCard title="Parts used" description="Using a part reduces on-hand stock.">
        <PartUsageForm snapshot={snapshot} jobOrderId={jobOrder.id} />
      </SectionCard>
      <SectionCard title="Billing" description={invoice ? invoice.invoiceNumber : "No invoice yet."}>
        {invoice ? (
          <Link className="text-sm font-medium text-primary" href={`/invoices/${invoice.id}`}>{invoice.invoiceNumber}</Link>
        ) : (
          <Button type="button" onClick={() => void updateSandboxShop((current) => createInvoiceFromJobOrderRecord(current, jobOrder.id).snapshot)}>
            Create invoice
          </Button>
        )}
      </SectionCard>
    </div>
  );
}

function ProductsScreen({ snapshot, id, action }: { snapshot: SandboxSnapshot; id?: string; action?: string }) {
  if (id === "new" || action === "edit") {
    const product = snapshot.products.find((item) => item.id === id);
    return (
      <div className="space-y-6">
        <PageHeader title={product ? `Edit ${product.name}` : "New Product"} description="Catalog changes stay in this browser." backHref="/products" backLabel="Back to products" />
        <ProductForm
          mode={product ? "edit" : "create"}
          categories={uniqueOptions(snapshot.products.map((item) => item.categoryName))}
          brands={uniqueOptions(snapshot.products.map((item) => item.brandName))}
          suppliers={snapshot.suppliers.map((item) => ({ id: item.id, label: item.supplierName }))}
          units={[{ id: SANDBOX_IDS.unit, label: "pc" }]}
          branches={[{ id: snapshot.branch.id, label: snapshot.branch.name }]}
          permissions={{ canMarkGlobal: true, canSelectOwningBranch: false }}
          initialImagePreviewUrl={product?.productImageUrl ?? null}
          initialValues={product ? productFormValues(snapshot, product) : emptyProduct(snapshot)}
        />
      </div>
    );
  }

  return (
    <ListScreen
      title="Products"
      description="Product master data."
      actionHref="/products/new"
      actionLabel="New Product"
      columns={["Product", "SKU", "Price", "On hand"]}
      rows={snapshot.products.map((item) => ({
        href: `/products/${item.id}/edit`,
        cells: [item.name, item.sku ?? "—", formatCurrency(item.sellingPrice), String(item.availableQuantity)],
      }))}
    />
  );
}

function ServicesScreen({ snapshot, id, action }: { snapshot: SandboxSnapshot; id?: string; action?: string }) {
  if (id === "new" || action === "edit") {
    const service = snapshot.services.find((item) => item.id === id);
    return (
      <div className="space-y-6">
        <PageHeader title={service ? `Edit ${service.name}` : "New Service"} description="Labor catalog for this browser." backHref="/services" backLabel="Back to services" />
        <ServiceForm
          mode={service ? "edit" : "create"}
          options={{
            branches: [{ id: snapshot.branch.id, label: snapshot.branch.name }],
            permissions: { canMarkGlobal: true, canSelectOwningBranch: false },
          }}
          initialValues={{
            serviceId: service?.id,
            owningBranchId: snapshot.branch.id,
            shareGlobally: false,
            name: service?.name ?? "",
            category: service?.category ?? "",
            description: service?.description ?? "",
            laborPrice: formatMoneyInputValue(service?.laborPrice ?? 0),
            estimatedDurationMinutes: service?.estimatedDurationMinutes ? String(service.estimatedDurationMinutes) : "",
            status: service?.status ?? "active",
          }}
        />
      </div>
    );
  }

  return (
    <ListScreen
      title="Services"
      description="Labor and service catalog."
      actionHref="/services/new"
      actionLabel="New Service"
      columns={["Service", "Category", "Labor"]}
      rows={snapshot.services.map((item) => ({
        href: `/services/${item.id}/edit`,
        cells: [item.name, item.category ?? "—", formatCurrency(item.laborPrice)],
      }))}
    />
  );
}

function SuppliersScreen({ snapshot, id, action }: { snapshot: SandboxSnapshot; id?: string; action?: string }) {
  if (id === "new" || action === "edit") {
    const supplier = snapshot.suppliers.find((item) => item.id === id);
    return (
      <div className="space-y-6">
        <PageHeader title={supplier ? `Edit ${supplier.supplierName}` : "New Supplier"} description="Supplier records stay in this browser." backHref="/suppliers" backLabel="Back to suppliers" />
        <SupplierForm
          mode={supplier ? "edit" : "create"}
          initialValues={{
            supplierId: supplier?.id,
            supplierName: supplier?.supplierName ?? "",
            contactPerson: supplier?.contactPerson ?? "",
            contactNumber: supplier?.contactNumber ?? "",
            email: supplier?.email ?? "",
            address: supplier?.address ?? "",
            paymentTerms: supplier?.paymentTerms ?? "",
            notes: supplier?.notes ?? "",
            status: supplier?.status ?? "active",
          }}
        />
      </div>
    );
  }

  return (
    <ListScreen
      title="Suppliers"
      description="Supplier directory."
      actionHref="/suppliers/new"
      actionLabel="New Supplier"
      columns={["Supplier", "Contact", "Status"]}
      rows={snapshot.suppliers.map((item) => ({
        href: `/suppliers/${item.id}/edit`,
        cells: [item.supplierName, item.contactNumber ?? "—", item.status],
      }))}
    />
  );
}

function InventoryScreen({ snapshot }: { snapshot: SandboxSnapshot }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock balances for the sample shop." />
      <SectionCard title="Receive stock" description="Adds quantity to a product in this browser.">
        <ReceiveStockForm snapshot={snapshot} />
      </SectionCard>
      <SimpleTable
        columns={["Product", "SKU", "On hand", "Reorder"]}
        rows={snapshot.products.map((item) => [item.name, item.sku ?? "—", String(item.availableQuantity), String(item.reorderLevel)])}
      />
    </div>
  );
}

function InvoicesScreen({ snapshot, id }: { snapshot: SandboxSnapshot; id?: string }) {
  if (!id) {
    return (
      <ListScreen
        title="Invoices"
        description="Billing and balances."
        columns={["Invoice", "Customer", "Status", "Balance"]}
        rows={snapshot.invoices.map((item) => ({
          href: `/invoices/${item.id}`,
          cells: [item.invoiceNumber, customerName(snapshot, item.customerId), item.status.replaceAll("_", " "), formatCurrency(item.balance)],
        }))}
      />
    );
  }

  const invoice = snapshot.invoices.find((item) => item.id === id);
  if (!invoice) return <Missing title="Invoice" />;
  const payments = snapshot.payments.filter((item) => item.invoiceId === invoice.id);
  return (
    <div className="space-y-6">
      <PageHeader title={invoice.invoiceNumber} description={customerName(snapshot, invoice.customerId)} backHref="/invoices" backLabel="Back to invoices" />
      <SectionCard title="Balance" description={`Total ${formatCurrency(invoice.totalAmount)} · Paid ${formatCurrency(invoice.paidAmount)}`}>
        <StatusBadge tone={invoice.balance > 0 ? "warning" : "success"}>{invoice.status.replaceAll("_", " ")}</StatusBadge>
        <p className="mt-3 text-lg font-semibold">{formatCurrency(invoice.balance)} remaining</p>
      </SectionCard>
      <SectionCard title="Record payment" description="Collections update the invoice balance locally.">
        <PaymentForm invoiceId={invoice.id} />
      </SectionCard>
      <SimpleTable columns={["Payment", "Method", "Amount", "Date"]} rows={payments.map((item) => [item.paymentNumber, item.paymentMethod, formatCurrency(item.amount), formatDate(item.paidAt)])} />
    </div>
  );
}

function PaymentsScreen({ snapshot, id }: { snapshot: SandboxSnapshot; id?: string }) {
  if (!id) {
    return (
      <ListScreen
        title="Payments"
        description="Collections and history."
        columns={["Payment", "Invoice", "Method", "Amount"]}
        rows={snapshot.payments.map((item) => ({
          href: `/payments/${item.id}`,
          cells: [
            item.paymentNumber,
            snapshot.invoices.find((invoice) => invoice.id === item.invoiceId)?.invoiceNumber ?? "—",
            item.paymentMethod,
            formatCurrency(item.amount),
          ],
        }))}
      />
    );
  }

  const payment = snapshot.payments.find((item) => item.id === id);
  if (!payment) return <Missing title="Payment" />;
  return (
    <RecordDetail
      title={payment.paymentNumber}
      subtitle={formatCurrency(payment.amount)}
      backHref="/payments"
      rows={[
        ["Method", payment.paymentMethod],
        ["Reference", payment.referenceNumber],
        ["Notes", payment.notes],
        ["Paid", formatDate(payment.paidAt)],
      ]}
    />
  );
}

function PosScreen({ snapshot }: { snapshot: SandboxSnapshot }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Point of Sale" description="Direct retail sales saved in this browser." />
      <SectionCard title="New sale" description="Choose a product, take payment, and stock is reduced.">
        <PosForm snapshot={snapshot} />
      </SectionCard>
      <SimpleTable
        columns={["Sale", "Total", "When"]}
        rows={snapshot.posSales.map((item) => [item.saleNumber, formatCurrency(item.totalAmount), formatDate(item.createdAt)])}
      />
    </div>
  );
}

function StaffScreen({ snapshot, id, action }: { snapshot: SandboxSnapshot; id?: string; action?: string }) {
  if (id === "new" || action === "edit") {
    const member = snapshot.staff.find((item) => item.id === id);
    return (
      <div className="space-y-6">
        <PageHeader
          title={member ? `Edit ${member.firstName} ${member.lastName}` : "New Staff Record"}
          description="Personnel stay in this browser. Portal logins are not created."
          backHref="/staff"
          backLabel="Back to staff"
        />
        <StaffForm
          mode={member ? "edit" : "create"}
          portalEmailDomain="sandbox.local"
          initialValues={{
            staffId: member?.id,
            staffCode: member?.staffCode ?? "",
            firstName: member?.firstName ?? "",
            lastName: member?.lastName ?? "",
            documentTitle: member?.documentTitle ?? "",
            role: member?.role ?? "mechanic",
            isPayrollEligible: member?.isPayrollEligible ?? true,
            contactNumber: member?.contactNumber ?? "",
            address: member?.address ?? "",
            sssNumber: member?.sssNumber ?? "",
            philhealthNumber: member?.philhealthNumber ?? "",
            tinNumber: member?.tinNumber ?? "",
            pagibigNumber: member?.pagibigNumber ?? "",
            emergencyContactName: member?.emergencyContactName ?? "",
            emergencyContactNumber: member?.emergencyContactNumber ?? "",
            status: member?.status ?? "active",
            linkPortalUsername: "",
          }}
        />
      </div>
    );
  }

  return (
    <ListScreen
      title="Staff"
      description="Personnel records."
      actionHref="/staff/new"
      actionLabel="New Staff"
      columns={["Name", "Role", "Status"]}
      rows={snapshot.staff.map((item) => ({
        href: `/staff/${item.id}/edit`,
        cells: [`${item.firstName} ${item.lastName}`, item.role.replaceAll("_", " "), item.status],
      }))}
    />
  );
}

function AttendanceScreen({
  snapshot,
  id,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  searchParams: URLSearchParams;
}) {
  if (id === "devices") {
    return (
      <PageHeader
        title="Attendance devices"
        description="Device tokens stay with a real staff account. Daily attendance on the main page is saved in this browser."
      />
    );
  }

  return <AttendancePageContent data={toAttendancePageData(snapshot, searchParams)} />;
}

function PayrollScreen({ snapshot, id }: { snapshot: SandboxSnapshot; id?: string }) {
  if (!id) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payroll" description="Compensation setup and payroll periods." />
        <PayrollPeriodForm />
        <ListScreen
          title="Periods"
          description="Open a period to regenerate pay from local attendance."
          columns={["Period", "Range", "Status"]}
          rows={snapshot.payrollPeriods.map((item) => ({
            href: `/payroll/${item.id}`,
            cells: [item.label, `${item.periodStartDate} – ${item.periodEndDate}`, item.status],
          }))}
        />
      </div>
    );
  }

  const period = snapshot.payrollPeriods.find((item) => item.id === id);
  if (!period) return <Missing title="Payroll period" />;
  const items = snapshot.payrollItems.filter((item) => item.periodId === period.id);
  return (
    <div className="space-y-6">
      <PageHeader title={period.label} description={`${period.periodStartDate} to ${period.periodEndDate}`} backHref="/payroll" backLabel="Back to payroll" />
      <Button type="button" onClick={() => void updateSandboxShop((current) => generatePayrollCutRecord(current, period.id))}>
        Generate payroll cut
      </Button>
      <SimpleTable
        columns={["Staff", "Present", "Base", "Net"]}
        rows={items.map((item) => [item.fullName, String(item.presentCount), formatCurrency(item.basePay), formatCurrency(item.netPay)])}
      />
    </div>
  );
}

function ReportsScreen({ snapshot }: { snapshot: SandboxSnapshot }) {
  const collected = snapshot.payments.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Trends from the sample shop in this browser." />
      <SimpleTable
        columns={["Measure", "Value"]}
        rows={[
          ["Customers", String(snapshot.customers.length)],
          ["Open job orders", String(snapshot.jobOrders.filter((item) => item.status === "in_progress").length)],
          ["Collected", formatCurrency(collected)],
          ["Unpaid balance", formatCurrency(snapshot.invoices.reduce((sum, item) => sum + item.balance, 0))],
        ]}
      />
    </div>
  );
}

function DocumentsScreen({ snapshot, id }: { snapshot: SandboxSnapshot; id?: string }) {
  if (id === "blank-preview") {
    return <PageHeader title="Blank preview" description="Print layouts in the sandbox use the browser print dialog." />;
  }
  if (id === "new" || id) {
    return <DocumentEditor snapshot={snapshot} documentId={id === "new" ? undefined : id} />;
  }
  return (
    <ListScreen
      title="Documents"
      description="Printable notes saved in this browser."
      actionHref="/documents/new"
      actionLabel="New Document"
      columns={["Title", "Status"]}
      rows={snapshot.documents.map((item) => ({ href: `/documents/${item.id}`, cells: [item.title, item.status] }))}
    />
  );
}

function SettingsScreen({
  snapshot,
  id,
  action,
  extra,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  action?: string;
  extra?: string;
}) {
  if (id === "branches") {
    return (
      <RecordDetail
        title={snapshot.branch.name}
        subtitle={snapshot.branch.code}
        backHref="/settings"
        rows={[
          ["Address", snapshot.branch.address],
          ["Phone", snapshot.branch.contactNumber],
          ["Email", snapshot.branch.email],
        ]}
      />
    );
  }
  if (id === "timekeeping") {
    return (
      <ListScreen
        title="Timekeeping"
        description="Holiday rules used when payroll is generated."
        columns={["Date", "Label", "Treatment"]}
        rows={snapshot.holidays.map((item) => ({ href: "/settings/timekeeping", cells: [item.holidayDate, item.label, item.payTreatment.replaceAll("_", " ")] }))}
      />
    );
  }
  if (id === "vehicle-lookups") {
    return (
      <ListScreen
        title="Vehicle lookups"
        description="Makes and models available on the vehicle form."
        columns={["Make", "Models"]}
        rows={snapshot.vehicleMakes.map((make) => ({
          href: "/settings/vehicle-lookups",
          cells: [make.name, snapshot.vehicleModels.filter((model) => model.makeId === make.id).map((model) => model.name).join(", ")],
        }))}
      />
    );
  }
  if (id === "website") {
    if (action === "journal") {
      return <JournalScreen snapshot={snapshot} postId={extra} />;
    }
    return (
      <div className="space-y-6">
        <PageHeader title="Website" description="Public content stored with the sample shop." />
        <Link className="text-sm font-medium text-primary" href="/settings/website/journal">Open journal</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Business identity for this browser." />
      <BusinessProfileForm
        initialValues={{
          businessName: snapshot.business.name,
          businessLogoUrl: snapshot.business.logoDataUrl,
          businessMarkUrl: snapshot.business.markDataUrl,
          businessAddress: snapshot.business.address,
          businessContact: snapshot.business.contact,
          businessEmail: snapshot.business.email,
          businessVatRegistrationNo: snapshot.business.vatRegistrationNo,
          receiptFooter: snapshot.business.receiptFooter,
          defaultTaxRate: snapshot.business.defaultTaxRate,
          allowGlobalProductCatalog: snapshot.business.allowGlobalProductCatalog,
          allowGlobalServiceCatalog: snapshot.business.allowGlobalServiceCatalog,
          allowPartialPayments: snapshot.business.allowPartialPayments,
          requireInvoiceBeforeJobCompletion: snapshot.business.requireInvoiceBeforeJobCompletion,
          requireInvoiceBeforeVehicleRelease: snapshot.business.requireInvoiceBeforeVehicleRelease,
          allowReleaseWithBalance: snapshot.business.allowReleaseWithBalance,
          requireFullPaymentBeforeRelease: snapshot.business.requireFullPaymentBeforeRelease,
          requireAdditionalItemPreApproval: snapshot.business.requireAdditionalItemPreApproval,
          enableBarcodeSupport: snapshot.business.enableBarcodeSupport,
          enableShelfLocation: snapshot.business.enableShelfLocation,
          payrollStandardDailyHours: snapshot.business.payrollStandardDailyHours,
          payrollHolidayPremiumRate: snapshot.business.payrollHolidayPremiumRate,
          payrollDefaultSssAmount: "0",
          payrollDefaultPhilhealthAmount: "0",
          payrollDefaultPagibigAmount: "0",
        }}
      />
    </div>
  );
}

function QuickAccessScreen({ snapshot }: { snapshot: SandboxSnapshot }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const vehicles = snapshot.vehicles.filter((item) =>
    `${item.plateNumber ?? ""} ${item.make} ${item.model}`.toLowerCase().includes(needle),
  );
  const customers = snapshot.customers.filter((item) => item.displayName.toLowerCase().includes(needle));
  return (
    <div className="space-y-6">
      <PageHeader title="Quick Access" description="Look up a customer or vehicle in the sample shop." />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Plate, make, or customer" />
      <SimpleTable columns={["Match", "Open"]} rows={[
        ...customers.map((item) => [item.displayName, "Customer"] as [string, string]),
        ...vehicles.map((item) => [`${item.plateNumber ?? ""} ${item.make} ${item.model}`.trim(), "Vehicle"] as [string, string]),
      ]} />
      <div className="flex flex-wrap gap-3 text-sm">
        {customers.map((item) => <Link key={item.id} className="text-primary" href={`/customers/${item.id}`}>{item.displayName}</Link>)}
        {vehicles.map((item) => <Link key={item.id} className="text-primary" href={`/vehicles/${item.id}`}>{item.plateNumber}</Link>)}
      </div>
    </div>
  );
}

function PrintScreen({ snapshot, path }: { snapshot: SandboxSnapshot; path: string }) {
  const id = path.split("/").filter((part) => part !== "print").at(-1);
  const title =
    snapshot.invoices.find((item) => item.id === id)?.invoiceNumber ??
    snapshot.quotations.find((item) => item.id === id)?.quotationNumber ??
    snapshot.jobOrders.find((item) => item.id === id)?.jobOrderNumber ??
    snapshot.payments.find((item) => item.id === id)?.paymentNumber ??
    "Sample shop document";
  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader title={title} description={snapshot.business.name} />
      <p className="text-sm text-muted-foreground">{snapshot.business.address}</p>
      <Button type="button" onClick={() => window.print()}>Print</Button>
    </div>
  );
}

function JobDetailsForm({ snapshot, jobOrder }: { snapshot: SandboxSnapshot; jobOrder: SandboxSnapshot["jobOrders"][number] }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const result = saveJobOrderDetailsRecord(snapshot, {
          jobOrderId: jobOrder.id,
          mileageIn: String(formData.get("mileageIn") ?? ""),
          mileageOut: String(formData.get("mileageOut") ?? ""),
          customerConcern: String(formData.get("customerConcern") ?? ""),
          inspectionNotes: String(formData.get("inspectionNotes") ?? ""),
          diagnosis: String(formData.get("diagnosis") ?? ""),
          workPerformed: String(formData.get("workPerformed") ?? ""),
        });
        if (!result.ok) {
          setMessage("Check mileage and notes, then try again.");
          return;
        }
        void updateSandboxShop(() => result.snapshot);
        setMessage("Saved in this browser.");
      }}
    >
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Input name="mileageIn" defaultValue={jobOrder.mileageIn ?? ""} placeholder="Mileage in" />
      <Input name="mileageOut" defaultValue={jobOrder.mileageOut ?? ""} placeholder="Mileage out" />
      <Textarea name="customerConcern" defaultValue={jobOrder.customerConcern ?? ""} placeholder="Customer concern" />
      <Textarea name="diagnosis" defaultValue={jobOrder.diagnosis ?? ""} placeholder="Diagnosis" />
      <Textarea name="workPerformed" defaultValue={jobOrder.workPerformed ?? ""} placeholder="Work performed" />
      <Textarea name="inspectionNotes" defaultValue={jobOrder.inspectionNotes ?? ""} placeholder="Inspection notes" />
      <Button type="submit">Save job details</Button>
    </form>
  );
}

function PartUsageForm({ snapshot, jobOrderId }: { snapshot: SandboxSnapshot; jobOrderId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_8rem_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
          const next = recordPartUsageRecord(
            snapshot,
            jobOrderId,
            String(formData.get("productId")),
            Number(formData.get("quantity")),
          );
          void updateSandboxShop(() => next);
          setMessage("Stock updated.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Could not use that part.");
        }
      }}
    >
      <NativeSelect name="productId" defaultValue={snapshot.products[0]?.id}>
        {snapshot.products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.availableQuantity})</option>)}
      </NativeSelect>
      <Input name="quantity" defaultValue="1" />
      <Button type="submit">Use part</Button>
      {message ? <p className="text-sm text-muted-foreground md:col-span-3">{message}</p> : null}
    </form>
  );
}

function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        void updateSandboxShop((current) => {
          const result = recordPaymentRecord(current, {
            invoiceId,
            amount: String(formData.get("amount") ?? ""),
            paymentMethod: String(formData.get("paymentMethod") ?? "cash"),
            referenceNumber: String(formData.get("referenceNumber") ?? ""),
            notes: String(formData.get("notes") ?? ""),
          });
          if (!result.ok) {
            throw new Error("Enter a payment amount greater than zero.");
          }
          return result.snapshot;
        }).then(() => setMessage("Payment saved in this browser.")).catch((error: unknown) => {
          setMessage(error instanceof Error ? error.message : "Could not record the payment.");
        });
      }}
    >
      <Input name="amount" placeholder="Amount" />
      <NativeSelect name="paymentMethod" defaultValue="cash">
        {PAYMENT_METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <Input name="referenceNumber" placeholder="Reference" />
      <Input name="notes" placeholder="Notes" />
      <Button type="submit">Record payment</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

function ReceiveStockForm({ snapshot }: { snapshot: SandboxSnapshot }) {
  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_8rem_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        void updateSandboxShop((current) => receiveStockRecord(current, String(formData.get("productId")), Number(formData.get("quantity"))));
      }}
    >
      <NativeSelect name="productId" defaultValue={snapshot.products[0]?.id}>
        {snapshot.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </NativeSelect>
      <Input name="quantity" defaultValue="1" />
      <Button type="submit">Receive</Button>
    </form>
  );
}

function PosForm({ snapshot }: { snapshot: SandboxSnapshot }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
          const next = completePosSaleRecord(snapshot, {
            customerId: String(formData.get("customerId") || "") || null,
            productId: String(formData.get("productId")),
            quantity: Number(formData.get("quantity")),
            paymentMethod: String(formData.get("paymentMethod")) as SandboxSnapshot["payments"][number]["paymentMethod"],
            referenceNumber: String(formData.get("referenceNumber") ?? ""),
          });
          void updateSandboxShop(() => next);
          setMessage("Sale saved in this browser.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Could not complete the sale.");
        }
      }}
    >
      <NativeSelect name="productId" defaultValue={snapshot.products[0]?.id}>
        {snapshot.products.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatCurrency(item.sellingPrice)}</option>)}
      </NativeSelect>
      <Input name="quantity" defaultValue="1" />
      <NativeSelect name="customerId" defaultValue={snapshot.customers[0]?.id}>
        {snapshot.customers.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
      </NativeSelect>
      <NativeSelect name="paymentMethod" defaultValue="cash">
        {PAYMENT_METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <Input name="referenceNumber" placeholder="Reference" />
      <Button type="submit">Complete sale</Button>
      {message ? <p className="text-sm text-muted-foreground md:col-span-2">{message}</p> : null}
    </form>
  );
}

function PayrollPeriodForm() {
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        void updateSandboxShop((current) => {
          const result = createPayrollPeriodRecord(current, {
            label: String(formData.get("label") ?? ""),
            periodStartDate: String(formData.get("periodStartDate") ?? ""),
            periodEndDate: String(formData.get("periodEndDate") ?? ""),
            payoutDate: String(formData.get("payoutDate") ?? ""),
            notes: String(formData.get("notes") ?? ""),
            applyGovernmentDeductions: false,
          });
          if (!result.ok) {
            throw new Error("Check the payroll dates and label.");
          }
          return result.snapshot;
        });
      }}
    >
      <Input name="label" placeholder="Period label" />
      <Input name="periodStartDate" type="date" />
      <Input name="periodEndDate" type="date" />
      <Input name="payoutDate" type="date" />
      <Input name="notes" placeholder="Notes" />
      <Button type="submit">Create period</Button>
    </form>
  );
}

function DocumentEditor({ snapshot, documentId }: { snapshot: SandboxSnapshot; documentId?: string }) {
  const document = snapshot.documents.find((item) => item.id === documentId);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        void updateSandboxShop((current) => {
          const title = String(formData.get("title") ?? "Untitled");
          const body = String(formData.get("body") ?? "");
          if (document) {
            return {
              ...current,
              documents: current.documents.map((item) =>
                item.id === document.id ? { ...item, title, body, status: "saved", updatedAt: new Date().toISOString() } : item,
              ),
            };
          }
          return {
            ...current,
            documents: [
              ...current.documents,
              { id: crypto.randomUUID(), title, body, status: "saved", updatedAt: new Date().toISOString() },
            ],
          };
        }).then(() => window.location.assign("/documents"));
      }}
    >
      <PageHeader title={document ? document.title : "New Document"} description="Saved only in this browser." backHref="/documents" backLabel="Back to documents" />
      <Input name="title" defaultValue={document?.title ?? ""} placeholder="Title" />
      <Textarea name="body" defaultValue={document?.body ?? ""} rows={8} />
      <Button type="submit">Save document</Button>
    </form>
  );
}

function JournalScreen({ snapshot, postId }: { snapshot: SandboxSnapshot; postId?: string }) {
  const post = snapshot.websitePosts.find((item) => item.id === postId);
  if (!postId || postId === "new" || post) {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          void updateSandboxShop((current) => {
            const title = String(formData.get("title") ?? "");
            const excerpt = String(formData.get("excerpt") ?? "");
            const body = String(formData.get("body") ?? "");
            if (post) {
              return {
                ...current,
                websitePosts: current.websitePosts.map((item) => item.id === post.id ? { ...item, title, excerpt, body } : item),
              };
            }
            return {
              ...current,
              websitePosts: [...current.websitePosts, { id: crypto.randomUUID(), title, excerpt, body, status: "draft", createdAt: new Date().toISOString() }],
            };
          }).then(() => window.location.assign("/settings/website/journal"));
        }}
      >
        <PageHeader title={post ? "Edit post" : "New post"} backHref="/settings/website/journal" backLabel="Back to journal" />
        <Input name="title" defaultValue={post?.title ?? ""} placeholder="Title" />
        <Input name="excerpt" defaultValue={post?.excerpt ?? ""} placeholder="Excerpt" />
        <Textarea name="body" defaultValue={post?.body ?? ""} />
        <Button type="submit">Save post</Button>
      </form>
    );
  }

  return (
    <ListScreen
      title="Journal"
      description="Website posts for the sample shop."
      actionHref="/settings/website/journal/new"
      actionLabel="New post"
      columns={["Title", "Status"]}
      rows={snapshot.websitePosts.map((item) => ({ href: `/settings/website/journal/${item.id}/edit`, cells: [item.title, item.status] }))}
    />
  );
}

function ListScreen({
  title,
  description,
  actionHref,
  actionLabel,
  columns,
  rows,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  columns: string[];
  rows: Array<{ href: string; cells: string[] }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={actionHref && actionLabel ? <PageHeaderActions primary={<PagePrimaryAction href={actionHref}>{actionLabel}</PagePrimaryAction>} /> : null}
      />
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
        <Table>
          <TableHeader>
            <TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.href + row.cells.join("|")}>
                {row.cells.map((cell, index) => (
                  <TableCell key={`${cell}-${index}`}>
                    <Link href={row.href} className="text-foreground hover:text-primary">{cell}</Link>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SimpleTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
      <Table>
        <TableHeader>
          <TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>{row.map((cell, index) => <TableCell key={`${cell}-${index}`}>{cell}</TableCell>)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RecordDetail({
  title,
  subtitle,
  backHref,
  editHref,
  rows,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  editHref?: string;
  rows: Array<[string, string | null]>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={subtitle}
        backHref={backHref}
        backLabel="Back"
        actions={editHref ? <PageHeaderActions primary={<PagePrimaryAction href={editHref}>Edit</PagePrimaryAction>} /> : null}
      />
      <SectionCard title="Details">
        <dl className="grid gap-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
    </div>
  );
}

function LineTable({ lines }: { lines: SandboxSnapshot["quotationLines"] }) {
  return <SimpleTable columns={["Item", "Qty", "Price", "Total"]} rows={lines.map((item) => [item.description, String(item.quantity), formatCurrency(item.unitPrice), formatCurrency(item.total)])} />;
}

function Missing({ title }: { title: string }) {
  return <PageHeader title={`${title} not found`} description="It may have been reset with the sample shop." />;
}

function emptyCustomer() {
  return {
    customerType: "individual" as const,
    firstName: "",
    lastName: "",
    companyName: "",
    contactNumber: "",
    email: "",
    address: "",
    notes: "",
    status: "active" as const,
  };
}

function emptyProduct(snapshot: SandboxSnapshot) {
  return {
    owningBranchId: snapshot.branch.id,
    shareGlobally: false,
    name: "",
    sku: "",
    barcode: "",
    categoryId: "",
    brandId: "",
    supplierId: snapshot.suppliers[0]?.id ?? "",
    unitId: SANDBOX_IDS.unit,
    partNumber: "",
    oemNumber: "",
    description: "",
    productType: "part" as const,
    costPrice: formatMoneyInputValue(0),
    sellingPrice: formatMoneyInputValue(0),
    reorderLevel: "0",
    warrantyDurationDays: "",
    shelfLocation: "",
    websiteVisible: false,
    websiteFeatured: false,
    websiteSortOrder: "0",
    websiteSlug: "",
    productImageUrl: "",
    websiteImageUrl: "",
    websiteShortDescription: "",
    websiteBadge: "",
    status: "active" as const,
  };
}

function productFormValues(snapshot: SandboxSnapshot, product: SandboxSnapshot["products"][number]) {
  return {
    ...emptyProduct(snapshot),
    productId: product.id,
    name: product.name,
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    categoryId: product.categoryName ?? "",
    brandId: product.brandName ?? "",
    supplierId: product.supplierId ?? "",
    unitId: product.unitId,
    description: product.description ?? "",
    productType: product.productType,
    costPrice: formatMoneyInputValue(product.costPrice),
    sellingPrice: formatMoneyInputValue(product.sellingPrice),
    reorderLevel: String(product.reorderLevel),
    shelfLocation: product.shelfLocation ?? "",
    websiteVisible: product.websiteVisible,
    productImageUrl: product.productImageUrl ?? "",
    status: product.status,
  };
}

function uniqueOptions(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].map((value) => ({
    id: value,
    label: value,
  }));
}

function lookupDataFrom(snapshot: SandboxSnapshot) {
  return {
    makes: snapshot.vehicleMakes.map((item) => ({ id: item.id, name: item.name })),
    models: snapshot.vehicleModels.map((item) => ({
      id: item.id,
      makeId: item.makeId,
      makeName: snapshot.vehicleMakes.find((make) => make.id === item.makeId)?.name ?? "",
      name: item.name,
    })),
    transmissions: snapshot.lookupOptions.filter((item) => item.lookupType === "transmission").map((item) => item.label),
    fuelTypes: snapshot.lookupOptions.filter((item) => item.lookupType === "fuel_type").map((item) => item.label),
    colors: snapshot.lookupOptions.filter((item) => item.lookupType === "color").map((item) => item.label),
  };
}
