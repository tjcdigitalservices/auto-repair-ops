"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { isDocumentTemplateName } from "@/components/document-engine/templates/registry";
import { JobOrderPrintLayout } from "@/components/reports/job-order-print-layout";
import { PayrollPrintLayout } from "@/components/reports/payroll-print-layout";
import { PayslipPrintLayout } from "@/components/reports/payslip-print-layout";
import { QuotationPrintLayout } from "@/components/reports/quotation-print-layout";
import { RemittancePrintLayout } from "@/components/reports/remittance-print-layout";
import { QuotationPrintToolbar } from "@/components/reports/quotation-print-toolbar";
import { ReportAutoPrint } from "@/components/reports/report-auto-print";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
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
import { MechanicPortalAmendmentsPage } from "@/features/attendance/components/mechanic-portal-amendments-page";
import { MechanicPortalAttendancePage } from "@/features/attendance/components/mechanic-portal-attendance-page";
import { MechanicPortalHistoryPage } from "@/features/attendance/components/mechanic-portal-history-page";
import { MechanicPortalProfilePage } from "@/features/attendance/components/mechanic-portal-profile-page";
import { InventoryPageView } from "@/features/inventory/components/inventory-page-view";
import { PosPageView } from "@/features/pos/components/pos-page-view";
import { TimekeepingCalendarPageContent } from "@/features/attendance/components/timekeeping-calendar-page-content";
import { CustomerDetailPageContent } from "@/features/customers/components/customer-detail-page-content";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { CustomersPageView } from "@/features/customers/components/customers-page-view";
import { DashboardHome } from "@/features/dashboard/components/dashboard-home";
import { DocumentEditorWorkspace } from "@/features/documents/components/document-editor-workspace";
import { DocumentsPageView } from "@/features/documents/components/documents-page-view";
import { NewDocumentTemplatePicker } from "@/features/documents/components/new-document-template-picker";
import { InvoiceDetailPageContent } from "@/features/invoices/components/invoice-detail-page-content";
import { InvoicesPageView } from "@/features/invoices/components/invoices-page-view";
import { PaymentDetailPageContent } from "@/features/invoices/components/payment-detail-page-content";
import { PaymentsPageView } from "@/features/invoices/components/payments-page-view";
import type { InvoiceStatus, PaymentMethod } from "@/features/invoices/types";
import { ReportsPageView } from "@/features/reports/components/reports-page-view";
import { ReportsPrintLayout } from "@/components/reports/reports-print-layout";
import { StaffPageView } from "@/features/staff/components/staff-page-view";
import type { StaffRole } from "@/features/staff/types";
import { VehicleLookupsPageContent } from "@/features/vehicles/components/vehicle-lookups-page-content";
import { PayrollPageContent } from "@/features/payroll/components/payroll-page-content";
import { PayrollPeriodDetail } from "@/features/payroll/components/payroll-period-detail";
import type { PayrollPageTab } from "@/features/payroll/components/payroll-tab-nav";
import { ProductForm } from "@/features/products/components/product-form";
import { ProductsPageView } from "@/features/products/components/products-page-view";
import { ServicesPageView } from "@/features/services/components/services-page-view";
import { SuppliersPageView } from "@/features/suppliers/components/suppliers-page-view";
import { QuotationCreateFlow } from "@/features/quotations/components/quotation-create-flow";
import { QuotationDetailPageContent } from "@/features/quotations/components/quotation-detail-page-content";
import { QuotationForm } from "@/features/quotations/components/quotation-form";
import { BookingsPageView } from "@/features/bookings/components/bookings-page-view";
import { QuotationsPageView } from "@/features/quotations/components/quotations-page-view";
import { SettingsPageTabs } from "@/features/settings/components/settings-page-tabs";
import { resolveSettingsPageTab } from "@/features/settings/utils";
import { ServiceForm } from "@/features/services/components/service-form";
import { StaffForm } from "@/features/staff/components/staff-form";
import { SupplierForm } from "@/features/suppliers/components/supplier-form";
import { VehicleDetailPageContent } from "@/features/vehicles/components/vehicle-detail-page-content";
import { VehicleForm } from "@/features/vehicles/components/vehicle-form";
import { VehiclesPageView } from "@/features/vehicles/components/vehicles-page-view";
import { JobOrderDetailPage } from "@/features/job-orders/components/job-order-detail-page";
import { JobOrdersPageView } from "@/features/job-orders/components/job-orders-page-view";
import { resolveJobOrderPrintHidePrices } from "@/features/job-orders/print-utils";
import type { JobOrderStatus } from "@/features/job-orders/types";
import { getSimplifiedJobOrderStatus, resolveJobOrderDetailTab } from "@/features/job-orders/utils";
import { resolveQuotationPrintMode } from "@/features/quotations/report-utils";
import { stripSandboxBasePath } from "@/features/sandbox/constants";
import {
  customerName,
  normalizeSandboxDocument,
  vehicleLabel,
} from "@/features/sandbox/records";
import {
  toSandboxPayrollPageData,
  toSandboxPayrollPeriodDetail,
  toSandboxPayrollPrintDocument,
  toSandboxPayslipPrintDocument,
  toSandboxRemittancePrintDocument,
  toSandboxRemittanceSummary,
} from "@/features/sandbox/payroll";
import { updateSandboxShop } from "@/features/sandbox/store";
import type { SandboxSnapshot } from "@/features/sandbox/types";
import {
  buildSandboxBookingsCalendarData,
  filterSandboxBookings,
  filterSandboxQuotations,
  isQuotationStatusFilter,
  toAttendancePageData,
  toCustomerDetail,
  toCustomerListItem,
  toDashboardData,
  listSandboxDocuments,
  listSandboxJobOrders,
  toJobOrderDetail,
  toJobOrderPrintDocument,
  toSandboxDocumentEditorData,
  toQuotationCreateFlowOptions,
  toQuotationDetail,
  toQuotationFormOptions,
  toQuotationPrintDocument,
  toQuotationReviseState,
  sandboxBranchSelector,
  sandboxProductFormOptions,
  toInventoryDashboardData,
  toPosTerminalData,
  toTimekeepingCalendarPageData,
  toMechanicPortalAmendmentsData,
  toMechanicPortalAttendanceData,
  toMechanicPortalHistoryData,
  listSandboxCustomerServiceHistory,
  listSandboxInvoices,
  listSandboxPayments,
  listSandboxProducts,
  listSandboxServices,
  listSandboxStaff,
  listSandboxSuppliers,
  listSandboxVehicleDocuments,
  listSandboxVehicles,
  listSandboxVehicleServiceHistory,
  toInvoiceDetail,
  toPaymentDetail,
  toSandboxReportsPageData,
  toSandboxReportsPrintDocument,
  toSandboxSettingsTabPageData,
  toVehicleDetail,
  toVehicleLookupPageData,
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
    return <PrintScreen snapshot={snapshot} path={path} searchParams={searchParams} />;
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
  if (section === "bookings") {
    return <BookingsScreen snapshot={snapshot} searchParams={searchParams} />;
  }
  if (section === "job-orders") {
    return <JobOrdersScreen snapshot={snapshot} id={id} searchParams={searchParams} />;
  }
  if (section === "products") {
    return <ProductsScreen snapshot={snapshot} id={id} action={action} searchParams={searchParams} />;
  }
  if (section === "services") {
    return <ServicesScreen snapshot={snapshot} id={id} action={action} searchParams={searchParams} />;
  }
  if (section === "suppliers") {
    return <SuppliersScreen snapshot={snapshot} id={id} action={action} searchParams={searchParams} />;
  }
  if (section === "inventory") {
    return <InventoryScreen snapshot={snapshot} searchParams={searchParams} />;
  }
  if (section === "invoices") {
    return <InvoicesScreen snapshot={snapshot} id={id} searchParams={searchParams} />;
  }
  if (section === "payments") {
    return <PaymentsScreen snapshot={snapshot} id={id} searchParams={searchParams} />;
  }
  if (section === "pos") {
    return <PosScreen snapshot={snapshot} />;
  }
  if (section === "staff") {
    return <StaffScreen snapshot={snapshot} id={id} action={action} searchParams={searchParams} />;
  }
  if (section === "attendance") {
    return <AttendanceScreen snapshot={snapshot} id={id} searchParams={searchParams} />;
  }
  if (section === "portal") {
    return <MechanicPortalScreen snapshot={snapshot} page={id} searchParams={searchParams} />;
  }
  if (section === "payroll") {
    return <PayrollScreen snapshot={snapshot} id={id} searchParams={searchParams} />;
  }
  if (section === "reports") {
    return <ReportsScreen snapshot={snapshot} searchParams={searchParams} />;
  }
  if (section === "documents") {
    return <DocumentsScreen snapshot={snapshot} id={id} searchParams={searchParams} />;
  }
  if (section === "settings") {
    return (
      <SettingsScreen
        snapshot={snapshot}
        id={id}
        action={action}
        extra={extra}
        searchParams={searchParams}
      />
    );
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
            createPortalLogin: false,
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
        serviceHistory={listSandboxCustomerServiceHistory(snapshot, id)}
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

  if (id === "new" || (action === "edit" && id)) {
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

  if (id && action === "past-service") {
    return (
      <PageHeader
        title="Past service"
        description="Recording past service stays available in the live shop. Use job orders or the mechanic portal for this sample shop demo."
        backHref={`/vehicles/${id}`}
        backLabel="Back to vehicle"
      />
    );
  }

  if (id) {
    const vehicle = toVehicleDetail(snapshot, id);
    if (!vehicle) return <Missing title="Vehicle" />;
    return (
      <VehicleDetailPageContent
        vehicle={vehicle}
        serviceHistory={listSandboxVehicleServiceHistory(snapshot, id)}
        documents={listSandboxVehicleDocuments(snapshot, id)}
        canViewServiceHistory
        canManageVehicles
        canCreateQuotations
        canRecordPastService={false}
        historicalSaved={searchParams.get("historicalSaved") === "1"}
      />
    );
  }

  const search = searchParams.get("search") ?? "";
  const customerId = searchParams.get("customerId") ?? undefined;

  return (
    <VehiclesPageView
      vehicles={listSandboxVehicles(snapshot, { search, customerId })}
      search={search}
      customerId={customerId}
      customerOptions={customerOptions}
      page={searchParams.get("page") ?? undefined}
      error={searchParams.get("error") ?? undefined}
      canManageVehicles
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
            quotationDate: new Date().toISOString().slice(0, 10),
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

function BookingsScreen({
  snapshot,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  searchParams: URLSearchParams;
}) {
  const statusParam = searchParams.get("status") ?? "";
  const month = searchParams.get("month") ?? undefined;
  const date = searchParams.get("date") ?? undefined;
  const calendarBookings = filterSandboxBookings(snapshot, "", "");
  const listBookings = filterSandboxBookings(snapshot, searchParams.get("search") ?? "", statusParam);

  return (
    <BookingsPageView
      bookings={listBookings}
      calendarBookings={calendarBookings}
      calendar={buildSandboxBookingsCalendarData(snapshot, calendarBookings, month, date)}
      search={searchParams.get("search") ?? ""}
      status={(statusParam || "") as "" | import("@/features/bookings/types").BookingStatus}
      page={searchParams.get("page") ?? undefined}
      branch={{ id: snapshot.branch.id, name: snapshot.branch.name, code: snapshot.branch.code }}
    />
  );
}

function JobOrdersScreen({
  snapshot,
  id,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  searchParams: URLSearchParams;
}) {
  if (!id) {
    const rawStatus = searchParams.get("status") ?? "";
    const status = rawStatus === "active" || rawStatus === ""
      ? rawStatus
      : getSimplifiedJobOrderStatus(rawStatus as JobOrderStatus);

    return (
      <JobOrdersPageView
        jobOrders={listSandboxJobOrders(snapshot, searchParams.get("search") ?? "", status)}
        search={searchParams.get("search") ?? ""}
        status={status}
        page={searchParams.get("page") ?? undefined}
        error={searchParams.get("error") ?? undefined}
        canDeleteJobOrders
        branchSelector={sandboxBranchSelector(snapshot)}
      />
    );
  }

  const jobOrder = toJobOrderDetail(snapshot, id);
  if (!jobOrder) return <Missing title="Job order" />;

  const assignedMechanicIds = new Set(jobOrder.mechanics.map((mechanic) => mechanic.staffId));
  const availableMechanics = snapshot.staff
    .filter((staff) => staff.status === "active" && staff.role === "mechanic" && !assignedMechanicIds.has(staff.id))
    .map((staff) => ({ id: staff.id, label: `${staff.firstName} ${staff.lastName}` }));

  return (
    <JobOrderDetailPage
      jobOrder={jobOrder}
      availableMechanics={availableMechanics}
      activeTab={resolveJobOrderDetailTab(searchParams.get("tab") ?? undefined)}
      canDeleteJobOrder={jobOrder.canDelete}
    />
  );
}

function ProductsScreen({
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
    <ProductsPageView
      products={listSandboxProducts(snapshot, searchParams.get("search") ?? "")}
      search={searchParams.get("search") ?? ""}
      page={searchParams.get("page") ?? undefined}
      pageSize={searchParams.get("pageSize") ?? undefined}
    />
  );
}

function ServicesScreen({
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
    <ServicesPageView
      services={listSandboxServices(snapshot, searchParams.get("search") ?? "")}
      search={searchParams.get("search") ?? ""}
      page={searchParams.get("page") ?? undefined}
    />
  );
}

function SuppliersScreen({
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
    <SuppliersPageView
      suppliers={listSandboxSuppliers(snapshot, searchParams.get("search") ?? "")}
      search={searchParams.get("search") ?? ""}
      page={searchParams.get("page") ?? undefined}
    />
  );
}

function InventoryScreen({
  snapshot,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  searchParams: URLSearchParams;
}) {
  const search = searchParams.get("search") ?? "";
  const stockState = readInventoryStockState(searchParams.get("stockState"));
  const movementType = searchParams.get("movementType") ?? "";
  const activeTab = searchParams.get("tab") === "movements" ? "movements" : "inventory";

  return (
    <InventoryPageView
      inventory={toInventoryDashboardData(snapshot, {
        search,
        stockState: activeTab === "inventory" ? stockState : "all",
        movementType: activeTab === "movements" ? (movementType as "stock_in" | "adjustment" | "damaged" | "service_usage" | "pos_sale" | "return" | "") : "",
      })}
      search={search}
      stockState={stockState}
      movementType={movementType as "stock_in" | "adjustment" | "damaged" | "service_usage" | "pos_sale" | "return" | ""}
      activeTab={activeTab}
      stockPage={searchParams.get("stockPage") ?? undefined}
      movementPage={searchParams.get("movementPage") ?? undefined}
      pageSize={searchParams.get("pageSize") ?? undefined}
      productFormOptions={sandboxProductFormOptions(snapshot)}
    />
  );
}

function readInventoryStockState(value: string | null) {
  if (value === "in_stock" || value === "low" || value === "out" || value === "missing") return value;
  return "all" as const;
}

function InvoicesScreen({
  snapshot,
  id,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  searchParams: URLSearchParams;
}) {
  if (id) {
    const invoice = toInvoiceDetail(snapshot, id);
    if (!invoice) return <Missing title="Invoice" />;
    return <InvoiceDetailPageContent invoice={invoice} canCancel={invoice.canCancel} />;
  }

  const statusParam = searchParams.get("status") ?? "";
  const status =
    statusParam === "unpaid" ||
    statusParam === "partially_paid" ||
    statusParam === "paid" ||
    statusParam === "cancelled"
      ? (statusParam as InvoiceStatus)
      : "";

  return (
    <InvoicesPageView
      invoices={listSandboxInvoices(snapshot, {
        search: searchParams.get("search") ?? "",
        status,
      })}
      search={searchParams.get("search") ?? ""}
      status={status}
      page={searchParams.get("page") ?? undefined}
      branchSelector={sandboxBranchSelector(snapshot)}
    />
  );
}

function PaymentsScreen({
  snapshot,
  id,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  searchParams: URLSearchParams;
}) {
  if (id) {
    const payment = toPaymentDetail(snapshot, id);
    if (!payment) return <Missing title="Payment" />;
    return <PaymentDetailPageContent payment={payment} />;
  }

  const methodParam = searchParams.get("paymentMethod") ?? "";
  const paymentMethod = (
    ["cash", "gcash", "bank_transfer", "card", "check", "other"] as const
  ).includes(methodParam as PaymentMethod)
    ? (methodParam as PaymentMethod)
    : "";

  return (
    <PaymentsPageView
      payments={listSandboxPayments(snapshot, {
        search: searchParams.get("search") ?? "",
        paymentMethod,
      })}
      search={searchParams.get("search") ?? ""}
      paymentMethod={paymentMethod}
      page={searchParams.get("page") ?? undefined}
      branchSelector={sandboxBranchSelector(snapshot)}
    />
  );
}

function PosScreen({ snapshot }: { snapshot: SandboxSnapshot }) {
  return <PosPageView terminal={toPosTerminalData(snapshot)} branchSelector={sandboxBranchSelector(snapshot)} />;
}

function StaffScreen({
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
  if (id === "new" || action === "edit") {
    const member = snapshot.staff.find((item) => item.id === id);
    return (
      <div className="space-y-6">
        <PageHeader
          title={member ? `Edit ${member.firstName} ${member.lastName}` : "New Staff Record"}
          description={
            member
              ? "Keep personnel data clean so later attendance and assignment logic has stable inputs."
              : "Create personnel records for attendance, payroll, and workshop assignments."
          }
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

  const roleParam = searchParams.get("role") ?? "";
  const role = (
    ["owner", "admin", "mechanic", "cashier", "inventory_staff", "service_advisor"] as const
  ).includes(roleParam as StaffRole)
    ? (roleParam as StaffRole)
    : "";

  return (
    <StaffPageView
      staff={listSandboxStaff(snapshot, {
        search: searchParams.get("search") ?? "",
        role,
      })}
      search={searchParams.get("search") ?? ""}
      role={role}
      page={searchParams.get("page") ?? undefined}
    />
  );
}

function MechanicPortalScreen({
  snapshot,
  page,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  page?: string;
  searchParams: URLSearchParams;
}) {
  const mechanic = snapshot.staff.find((member) => member.role === "mechanic");
  const displayName = mechanic ? `${mechanic.firstName} ${mechanic.lastName}` : "Carlo Dela Cruz";

  if (!page || page === "attendance") {
    return <MechanicPortalAttendancePage data={toMechanicPortalAttendanceData(snapshot)} />;
  }

  if (page === "history") {
    const data = toMechanicPortalHistoryData(snapshot, searchParams.get("month") ?? undefined);
    return <MechanicPortalHistoryPage key={`${data.month}:${data.initialSelectedDate}`} data={data} />;
  }

  if (page === "amendments") {
    return <MechanicPortalAmendmentsPage data={toMechanicPortalAmendmentsData(snapshot)} />;
  }

  if (page === "profile") {
    return <MechanicPortalProfilePage displayName={displayName} role="mechanic" />;
  }

  return (
    <PageHeader
      title="Page not in the mechanic portal"
      description="Open attendance, history, correction requests, or profile."
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

function PayrollScreen({
  snapshot,
  id,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  searchParams: URLSearchParams;
}) {
  if (!id) {
    const tab = searchParams.get("tab");
    const activeTab: PayrollPageTab =
      tab === "compensation" || tab === "remittance" ? tab : "periods";
    return (
      <PayrollPageContent
        data={toSandboxPayrollPageData(snapshot, searchParams)}
        remittanceData={toSandboxRemittanceSummary(snapshot, searchParams.get("month"))}
        activeTab={activeTab}
        periodPage={searchParams.get("periodPage") ?? undefined}
        staffPage={searchParams.get("staffPage") ?? undefined}
        branchSelector={sandboxBranchSelector(snapshot)}
      />
    );
  }

  const data = toSandboxPayrollPeriodDetail(snapshot, id);
  if (!data) return <Missing title="Payroll period" />;
  return <PayrollPeriodDetail data={data} />;
}

function ReportsScreen({
  snapshot,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  searchParams: URLSearchParams;
}) {
  return (
    <ReportsPageView
      reports={toSandboxReportsPageData(snapshot, {
        preset: searchParams.get("preset"),
        from: searchParams.get("from"),
        to: searchParams.get("to"),
        groupBy: searchParams.get("groupBy"),
      })}
      branchSelector={sandboxBranchSelector(snapshot)}
      showDownloadPdf={false}
    />
  );
}

function DocumentsScreen({
  snapshot,
  id,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  id?: string;
  searchParams: URLSearchParams;
}) {
  const editorData = toSandboxDocumentEditorData(snapshot);

  if (id === "blank-preview") {
    return <BlankDocumentRedirect />;
  }

  if (id === "new") {
    const template = searchParams.get("template");
    if (!template) return <NewDocumentTemplatePicker />;
    if (!isDocumentTemplateName(template)) return <Missing title="Document" />;

    return (
      <DocumentEditorWorkspace
        businessProfile={editorData.businessProfile}
        branchName={editorData.branchName}
        showBranchContext={editorData.showBranchContext}
        template={template}
      />
    );
  }

  if (id) {
    const document = snapshot.documents
      .map((item) => normalizeSandboxDocument(item))
      .find((item) => item.id === id);
    if (!document || document.status === "archived") return <Missing title="Document" />;

    return (
      <DocumentEditorWorkspace
        businessProfile={editorData.businessProfile}
        branchName={editorData.branchName}
        showBranchContext={editorData.showBranchContext}
        document={document}
      />
    );
  }

  const status = searchParams.get("status") ?? "all";

  return (
    <DocumentsPageView
      documents={listSandboxDocuments(snapshot, searchParams.get("search") ?? "", status)}
      search={searchParams.get("search") ?? ""}
      status={status}
      page={searchParams.get("page") ?? undefined}
    />
  );
}

function BlankDocumentRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/documents/new?template=blank");
  }, [router]);

  return null;
}

function SettingsScreen({
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
  if (id === "branches") {
    return (
      <div className="space-y-0">
        <PageHeader
          title="Settings"
          description="Business identity and operational billing behavior."
        />
        <SettingsPageTabs
          activeTab="branches"
          data={toSandboxSettingsTabPageData(snapshot, "branches")}
          resolveTabData={(tab) => toSandboxSettingsTabPageData(snapshot, tab)}
        />
      </div>
    );
  }
  if (id === "timekeeping") {
    return (
      <TimekeepingCalendarPageContent
        data={toTimekeepingCalendarPageData(snapshot)}
        branchSelector={sandboxBranchSelector(snapshot)}
      />
    );
  }
  if (id === "vehicle-lookups") {
    return (
      <div className="space-y-0">
        <PageHeader
          title="Vehicle lookups"
          description="Internal make, model, and dropdown reference data for vehicle registration."
          actions={
            <PageHeaderActions
              primary={
                <Button asChild variant="outline">
                  <Link href="/settings">Back to settings</Link>
                </Button>
              }
            />
          }
        />
        <VehicleLookupsPageContent data={toVehicleLookupPageData(snapshot)} />
      </div>
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

  const activeTab = resolveSettingsPageTab(searchParams.get("tab") ?? undefined);
  return (
    <div className="space-y-0">
      <PageHeader
        title="Settings"
        description="Business identity and operational billing behavior."
      />
      <SettingsPageTabs
        activeTab={activeTab}
        data={toSandboxSettingsTabPageData(snapshot, activeTab)}
        resolveTabData={(tab) => toSandboxSettingsTabPageData(snapshot, tab)}
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

function PrintScreen({
  snapshot,
  path,
  searchParams,
}: {
  snapshot: SandboxSnapshot;
  path: string;
  searchParams: URLSearchParams;
}) {
  const segments = path.split("/").filter(Boolean);
  const [section, id, action, extra] = segments;

  if (section === "payroll" && id === "remittance" && action === "print") {
    const document = toSandboxRemittancePrintDocument(snapshot, searchParams.get("month"));
    return (
      <ReportPage wrapInPrintPage={false} toolbar={<ReportToolbar />}>
        <ReportAutoPrint enabled={searchParams.get("autoprint") === "1"} />
        <RemittancePrintLayout document={document} />
      </ReportPage>
    );
  }

  if (section === "payroll" && action === "payslip" && id && extra) {
    const document = toSandboxPayslipPrintDocument(snapshot, id, extra);
    if (!document) return <Missing title="Payslip" />;
    return (
      <ReportPage wrapInPrintPage={false} toolbar={<ReportToolbar primaryPrintLabel="Print payslip" />}>
        <ReportAutoPrint enabled={searchParams.get("autoprint") === "1"} />
        <PayslipPrintLayout document={document} />
      </ReportPage>
    );
  }

  if (section === "payroll" && action === "print" && id) {
    const document = toSandboxPayrollPrintDocument(snapshot, id);
    if (!document) return <Missing title="Payroll period" />;
    return (
      <ReportPage wrapInPrintPage={false} toolbar={<ReportToolbar primaryPrintLabel="Print payroll" />}>
        <ReportAutoPrint enabled={searchParams.get("autoprint") === "1"} />
        <PayrollPrintLayout document={document} />
      </ReportPage>
    );
  }

  if (section === "quotations" && action === "print" && id) {
    const document = toQuotationPrintDocument(snapshot, id);
    if (!document) return <Missing title="Quotation" />;
    const mode = resolveQuotationPrintMode(searchParams.get("mode") ?? undefined);

    return (
      <ReportPage
        wrapInPrintPage={false}
        toolbar={<QuotationPrintToolbar quotationId={document.quotation.id} mode={mode} showDownload={false} />}
      >
        <QuotationPrintLayout document={document} mode={mode} />
      </ReportPage>
    );
  }

  if (section === "job-orders" && action === "print" && id) {
    const document = toJobOrderPrintDocument(snapshot, id);
    if (!document) return <Missing title="Job order" />;
    const hidePrices = resolveJobOrderPrintHidePrices({
      hidePrices: searchParams.get("hidePrices") ?? undefined,
      showPrices: searchParams.get("showPrices") ?? undefined,
    });

    return (
      <ReportPage
        wrapInPrintPage={false}
        toolbar={
          <ReportToolbar
            alternatePrintHref={`/job-orders/${document.jobOrder.id}/print${hidePrices ? "?showPrices=1" : ""}`}
            showingAlternatePrint={hidePrices}
            alternatePrintLabel="Print with Prices"
            primaryPrintLabel="Print Job Order"
          />
        }
      >
        <ReportAutoPrint enabled={searchParams.get("autoprint") === "1"} />
        <JobOrderPrintLayout document={document} hidePrices={hidePrices} />
      </ReportPage>
    );
  }

  if (section === "reports" && segments.at(-1) === "print") {
    const document = toSandboxReportsPrintDocument(snapshot, {
      preset: searchParams.get("preset"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      groupBy: searchParams.get("groupBy"),
    });

    return (
      <ReportPage wrapInPrintPage={false} toolbar={<ReportToolbar primaryPrintLabel="Print report" />}>
        <ReportAutoPrint enabled={searchParams.get("autoprint") === "1"} />
        <ReportsPrintLayout document={document} />
      </ReportPage>
    );
  }

  const fallbackId = segments.filter((part) => part !== "print").at(-1);
  const title =
    snapshot.invoices.find((item) => item.id === fallbackId)?.invoiceNumber ??
    snapshot.quotations.find((item) => item.id === fallbackId)?.quotationNumber ??
    snapshot.jobOrders.find((item) => item.id === fallbackId)?.jobOrderNumber ??
    snapshot.payments.find((item) => item.id === fallbackId)?.paymentNumber ??
    "Sample shop document";
  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader title={title} description={snapshot.business.name} />
      <p className="text-sm text-muted-foreground">{snapshot.business.address}</p>
      <Button type="button" onClick={() => window.print()}>Print</Button>
    </div>
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
    createPortalLogin: false,
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
