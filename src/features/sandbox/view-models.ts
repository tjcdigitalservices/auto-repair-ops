import { DateTime } from "luxon";

import type {
  AttendanceAccessSettings,
  AttendanceCalendarDaySummary,
  AttendancePageData,
  AttendancePageFilters,
  AttendanceRecordSummary,
  AttendanceRosterData,
  AttendanceRosterItem,
  AttendanceTimeLogSummary,
  BranchHolidaySummary,
  DtrAmendmentSummary,
  MechanicPortalAmendmentsPageData,
  MechanicPortalAttendancePageData,
  MechanicPortalHistoryCalendarStatus,
  MechanicPortalHistoryPageData,
  StaffDeviceSummary,
  TimekeepingCalendarPageData,
} from "@/features/attendance/types";
import {
  buildAttendanceSummary,
  getDefaultAttendanceDate,
  hasMissingTimeout,
  isAttendanceApproved,
  isScheduledWorkdayForDate,
  matchesAttendanceStatusFilter,
  matchesRosterStatusFilter,
  resolveAttendancePageFilters,
} from "@/features/attendance/utils";
import { getBusinessNow } from "@/lib/dates";
import type { CustomerDetail, CustomerDocumentHistoryItem, CustomerListItem } from "@/features/customers/types";
import type { ServiceHistoryEntry, ServiceHistoryLineItem } from "@/features/service-history/types";
import {
  resolveServiceHistoryDate,
  resolveServiceHistoryPhase,
  sortServiceHistoryEntries,
} from "@/features/service-history/utils";
import type { VehicleDetail, VehicleListItem } from "@/features/vehicles/types";
import type { DashboardData } from "@/features/dashboard/queries/dashboard-queries";
import type { DocumentEditorPageData, DocumentListItem } from "@/features/documents/types";
import type { JobOrderDetail, JobOrderItemDetail, JobOrderListItem, JobOrderPrintDocument } from "@/features/job-orders/types";
import {
  calculateJobOrderBillableTotal,
  calculateJobOrderPendingApprovalCount,
  calculateJobOrderPendingApprovalTotal,
  calculateJobOrderRejectedAdditionalTotal,
  canAddAdditionalItems,
  canAssignMechanics,
  canDeleteJobOrder,
  canEditJobOrderDetails,
  canEditJobOrderItems,
  canGenerateJobOrderInvoice,
  canReleaseJobOrderVehicle,
  canResolveAdditionalItems,
  canUpdateJobOrderChecklist,
  expandJobOrderStatusFilter,
  getAllowedJobOrderStatusTransitions,
} from "@/features/job-orders/utils";
import { mapQuotationDetailToFormValues } from "@/features/quotations/mappers";
import type {
  QuotationCreateFlowOptions,
  QuotationDetail,
  QuotationFormOptions,
  QuotationListItem,
  QuotationPrintDocument,
  QuotationStatus,
} from "@/features/quotations/types";
import { canDeleteQuotation, canReviseQuotation } from "@/features/quotations/utils";
import { SANDBOX_IDS } from "@/features/sandbox/ids";
import {
  buildPaymentMethodBreakdown,
  buildRevenueTrend,
  buildStatusBreakdown,
  buildTopPerformers,
  buildTrendBuckets,
  buildWorkflowFunnel,
  filterByIsoDateRange,
  getReportRangeBounds,
  resolveReportFilters,
} from "@/features/reports/utils";
import type { ReportsPageData, ReportsPrintDocument } from "@/features/reports/types";
import {
  customerName,
  ensureSandboxServiceHistory,
  ensureSandboxShopSettings,
  ensureSandboxStockMovements,
  ensureSandboxTimekeeping,
  normalizeSandboxDocument,
  vehicleLabel,
} from "@/features/sandbox/records";
import { buildInventorySummary, filterInventoryStocks } from "@/features/inventory/utils";
import { mapInventoryStockItemToProductOption } from "@/features/inventory/mappers";
import type {
  InventoryDashboardData,
  InventoryMovementType,
  InventoryStockFilterState,
  InventoryStockItem,
} from "@/features/inventory/types";
import type {
  InvoiceDetail,
  InvoiceListItem,
  InvoiceStatus,
  PaymentDetail,
  PaymentListItem,
  PaymentMethod,
} from "@/features/invoices/types";
import {
  canCancelInvoice,
  canRecordInvoicePayment,
  canReleaseInvoiceVehicle,
} from "@/features/invoices/utils";
import type { PosTerminalData } from "@/features/pos/types";
import type { ProductFormOptionsData, ProductListItem } from "@/features/products/types";
import type { ServiceListItem } from "@/features/services/types";
import type { StaffListItem, StaffRole } from "@/features/staff/types";
import type { SupplierListItem } from "@/features/suppliers/types";
import type {
  BusinessSettingsValues,
  SettingsDocumentSequence,
  SettingsPageTab,
  SettingsTabPageData,
} from "@/features/settings/types";
import type {
  VehicleLookupOptionGroup,
  VehicleLookupPageData,
  VehicleLookupType,
  VehicleMakeItem,
  VehicleModelItem,
} from "@/features/vehicles/types";
import { SANDBOX_SHOP_PUBLIC_IP } from "@/features/sandbox/seed";
import type { SandboxSnapshot } from "@/features/sandbox/types";
import { DEFAULT_BRAND_PACK } from "@/lib/branding/types";
import { roundCurrency } from "@/lib/currency";

const VEHICLE_LOOKUP_LABELS: Record<VehicleLookupType, string> = {
  transmission: "Transmission options",
  fuel_type: "Fuel type options",
  color: "Color options",
};

const ZONE = "Asia/Manila";
const ACTIVE_JOB_STATUSES = new Set([
  "pending",
  "in_progress",
  "waiting_for_parts",
  "waiting_for_customer_approval",
  "ready_for_billing",
]);

export function toVehicleListItem(
  snapshot: SandboxSnapshot,
  vehicle: SandboxSnapshot["vehicles"][number],
): VehicleListItem {
  return {
    id: vehicle.id,
    customerId: vehicle.customerId,
    customerName: customerName(snapshot, vehicle.customerId),
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    plateNumber: vehicle.plateNumber,
    vin: vehicle.vin,
    mileage: vehicle.mileage,
    transmission: vehicle.transmission,
    engineSize: vehicle.engineSize,
    variant: vehicle.variant,
    fuelType: vehicle.fuelType,
    color: vehicle.color,
    status: vehicle.status,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

export function toVehicleDetail(snapshot: SandboxSnapshot, vehicleId: string): VehicleDetail | null {
  const vehicle = snapshot.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) return null;
  return toVehicleListItem(snapshot, vehicle);
}

export function listSandboxVehicles(
  snapshot: SandboxSnapshot,
  {
    search = "",
    customerId,
  }: {
    search?: string;
    customerId?: string | null;
  } = {},
) {
  const needle = search.trim().toLowerCase();
  return snapshot.vehicles
    .filter((vehicle) => {
      if (customerId && vehicle.customerId !== customerId) return false;
      if (!needle) return true;
      const haystack = [
        vehicle.make,
        vehicle.model,
        vehicle.plateNumber ?? "",
        vehicle.vin ?? "",
        customerName(snapshot, vehicle.customerId),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .map((vehicle) => toVehicleListItem(snapshot, vehicle))
    .sort((left, right) => {
      const leftLabel = `${left.make} ${left.model}`.toLowerCase();
      const rightLabel = `${right.make} ${right.model}`.toLowerCase();
      return leftLabel.localeCompare(rightLabel) || left.createdAt.localeCompare(right.createdAt);
    });
}

export function listSandboxVehicleDocuments(
  snapshot: SandboxSnapshot,
  vehicleId: string,
): CustomerDocumentHistoryItem[] {
  return documentHistory(snapshot, snapshot.vehicles.find((item) => item.id === vehicleId)?.customerId ?? "")
    .filter((item) => {
      const quotation = snapshot.quotations.find((entry) => entry.id === item.id);
      if (quotation) return quotation.vehicleId === vehicleId;
      const jobOrder = snapshot.jobOrders.find((entry) => entry.id === item.id);
      if (jobOrder) return jobOrder.vehicleId === vehicleId;
      const invoice = snapshot.invoices.find((entry) => entry.id === item.id);
      if (invoice) return invoice.vehicleId === vehicleId;
      return false;
    });
}

export function listSandboxVehicleServiceHistory(
  snapshot: SandboxSnapshot,
  vehicleId: string,
): ServiceHistoryEntry[] {
  return listSandboxServiceHistory(snapshot).filter((entry) => entry.vehicleId === vehicleId);
}

export function listSandboxCustomerServiceHistory(
  snapshot: SandboxSnapshot,
  customerId: string,
): ServiceHistoryEntry[] {
  return listSandboxServiceHistory(snapshot).filter((entry) => entry.customerId === customerId);
}

function listSandboxServiceHistory(snapshot: SandboxSnapshot): ServiceHistoryEntry[] {
  const shop = ensureSandboxServiceHistory(snapshot);
  const entries = shop.jobOrders.flatMap((jobOrder) => {
    const phase = resolveServiceHistoryPhase(jobOrder.status);
    if (!phase) return [];

    const label = vehicleLabel(shop, jobOrder.vehicleId);
    const lines = shop.jobOrderLines.filter((line) => line.parentId === jobOrder.id);
    const services: ServiceHistoryLineItem[] = lines
      .filter((line) => line.itemType === "service" && line.approvalStatus !== "rejected")
      .map((line) => ({
        id: line.id,
        itemType: "service" as const,
        label: line.description,
        quantity: line.quantity,
        amount: line.total,
        isAdditional: Boolean(line.isAdditional),
        usageSource: "actual" as const,
      }));
    const partsUsed: ServiceHistoryLineItem[] = lines
      .filter((line) => line.itemType === "product" && line.approvalStatus !== "rejected")
      .map((line) => ({
        id: line.id,
        itemType: "product" as const,
        label: line.description,
        quantity: line.quantity,
        amount: line.total,
        isAdditional: Boolean(line.isAdditional),
        usageSource: "actual" as const,
      }));
    const rejectedExtras: ServiceHistoryLineItem[] = lines
      .filter((line) => line.approvalStatus === "rejected")
      .map((line) => ({
        id: line.id,
        itemType: line.itemType,
        label: line.description,
        quantity: line.quantity,
        amount: line.total,
        isAdditional: Boolean(line.isAdditional),
        usageSource: "actual" as const,
      }));
    const invoice = shop.invoices.find((item) => item.jobOrderId === jobOrder.id) ?? null;
    const quotation = jobOrder.quotationId
      ? shop.quotations.find((item) => item.id === jobOrder.quotationId) ?? null
      : null;
    const mechanic = jobOrder.assignedStaffId
      ? shop.staff.find((member) => member.id === jobOrder.assignedStaffId)
      : null;
    const billableTotal = [...services, ...partsUsed].reduce((sum, item) => sum + item.amount, 0);
    const isHistorical = Boolean(jobOrder.isHistorical);

    return [
      {
        id: jobOrder.id,
        vehicleId: jobOrder.vehicleId,
        vehicleLabel: label,
        customerId: jobOrder.customerId,
        jobOrderId: jobOrder.id,
        jobOrderNumber: jobOrder.jobOrderNumber,
        status: jobOrder.status,
        phase,
        isHistorical,
        serviceDate: resolveServiceHistoryDate({
          isHistorical,
          serviceDate: jobOrder.serviceDate,
          releasedAt: jobOrder.releasedAt,
          completedAt: jobOrder.completedAt,
          createdAt: jobOrder.createdAt,
        }),
        createdAt: jobOrder.createdAt,
        startedAt: jobOrder.startedAt,
        completedAt: jobOrder.completedAt,
        releasedAt: jobOrder.releasedAt,
        customerConcern: jobOrder.customerConcern,
        inspectionNotes: jobOrder.inspectionNotes,
        diagnosis: jobOrder.diagnosis,
        workPerformed: jobOrder.workPerformed,
        mileageIn: jobOrder.mileageIn,
        mileageOut: jobOrder.mileageOut,
        services,
        partsUsed,
        rejectedExtras,
        mechanics: mechanic
          ? [
              {
                id: mechanic.id,
                fullName: `${mechanic.firstName} ${mechanic.lastName}`.trim(),
                taskDescription: null,
              },
            ]
          : [],
        invoice: invoice
          ? {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              totalAmount: invoice.totalAmount,
              paidAmount: invoice.paidAmount,
              balance: invoice.balance,
            }
          : null,
        quotation: quotation
          ? {
              id: quotation.id,
              quotationNumber: quotation.quotationNumber,
            }
          : null,
        totalAmount: invoice?.totalAmount ?? billableTotal,
        paymentMethod: null,
      } satisfies ServiceHistoryEntry,
    ];
  });

  return sortServiceHistoryEntries(entries);
}

export function toCustomerListItem(customer: SandboxSnapshot["customers"][number]): CustomerListItem {
  return {
    id: customer.id,
    customerCode: customer.customerCode,
    customerType: customer.customerType,
    displayName: customer.displayName,
    contactNumber: customer.contactNumber,
    email: customer.email,
    status: customer.status,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export function toCustomerDetail(snapshot: SandboxSnapshot, customerId: string): CustomerDetail | null {
  const customer = snapshot.customers.find((item) => item.id === customerId);
  if (!customer) return null;

  const vehicles = snapshot.vehicles.filter((item) => item.customerId === customerId);
  return {
    ...toCustomerListItem(customer),
    firstName: customer.firstName,
    lastName: customer.lastName,
    companyName: customer.companyName,
    address: customer.address,
    notes: customer.notes,
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vin,
      status: vehicle.status,
    })),
    documentHistory: documentHistory(snapshot, customerId),
  };
}

export function toDashboardData(snapshot: SandboxSnapshot): DashboardData {
  const now = DateTime.now().setZone(ZONE);
  const buckets = buildTrendBuckets({
    from: now.minus({ months: 5 }).startOf("month").toISODate() ?? now.toISODate() ?? "",
    to: now.endOf("month").toISODate() ?? "",
    groupBy: "monthly",
  });
  const trend = buildRevenueTrend({
    buckets,
    approvedQuotations: snapshot.quotations.filter((item) => item.status === "approved" && item.approvedAt),
    releases: snapshot.jobOrders.filter((item) => item.releasedAt),
    getApprovedDate: (row) => row.approvedAt ?? row.createdAt,
    getApprovedAmount: (row) => row.totalAmount,
    getReleaseDate: (row) => row.releasedAt ?? row.createdAt,
  });
  const invoiceTrend = buildRevenueTrend({
    buckets,
    approvedQuotations: snapshot.invoices.filter((item) => item.status !== "cancelled"),
    releases: snapshot.jobOrders.filter((item) => item.releasedAt),
    getApprovedDate: (row) => row.createdAt,
    getApprovedAmount: (row) => row.totalAmount,
    getReleaseDate: (row) => row.releasedAt ?? row.createdAt,
  });

  return {
    metrics: {
      totalCustomers: snapshot.customers.filter((item) => item.status === "active").length,
      totalVehicles: snapshot.vehicles.filter((item) => item.status === "active").length,
      pendingQuotations: snapshot.quotations.filter((item) => item.status === "draft" || item.status === "pending_approval").length,
      activeJobOrders: snapshot.jobOrders.filter((item) => ACTIVE_JOB_STATUSES.has(item.status)).length,
      lowStockItems: snapshot.products.filter((item) => item.availableQuantity <= item.reorderLevel).length,
      unpaidInvoices: snapshot.invoices.filter((item) => item.balance > 0 && item.status !== "cancelled").length,
    },
    recentQuotations: [...snapshot.quotations]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        quotationNumber: item.quotationNumber,
        customerName: customerName(snapshot, item.customerId),
        totalAmount: item.totalAmount,
        status: item.status,
        createdAt: item.createdAt,
      })),
    recentJobOrders: [...snapshot.jobOrders]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        jobOrderNumber: item.jobOrderNumber,
        customerName: customerName(snapshot, item.customerId),
        vehicleLabel: vehicleLabel(snapshot, item.vehicleId),
        status: item.status,
        createdAt: item.createdAt,
      })),
    inventoryAlerts: snapshot.products
      .filter((item) => item.availableQuantity <= item.reorderLevel)
      .map((item) => ({
        productId: item.id,
        productName: item.name,
        sku: item.sku,
        availableQuantity: item.availableQuantity,
        reorderLevel: item.reorderLevel,
      })),
    unpaidInvoices: snapshot.invoices
      .filter((item) => item.balance > 0 && item.status !== "cancelled")
      .map((item) => ({
        id: item.id,
        invoiceNumber: item.invoiceNumber,
        customerName: customerName(snapshot, item.customerId),
        status: item.status,
        balance: item.balance,
      })),
    quotationAndServiceTrend: trend,
    invoiceAndServiceTrend: invoiceTrend,
    requireInvoiceBeforeVehicleRelease: snapshot.business.requireInvoiceBeforeVehicleRelease,
    serviceTrend: buckets.map((bucket) => ({
      label: bucket.label,
      value: snapshot.jobOrders.filter((item) => {
        const stamp = item.completedAt ?? item.createdAt;
        return stamp >= bucket.fromIso && stamp <= bucket.toIso && item.status !== "cancelled";
      }).length,
    })),
  };
}

function documentHistory(snapshot: SandboxSnapshot, customerId: string): CustomerDocumentHistoryItem[] {
  const quotations = snapshot.quotations
    .filter((item) => item.customerId === customerId)
    .map((item) => ({
      id: item.id,
      documentType: "quotation" as const,
      documentLabel: item.quotationNumber,
      documentHref: `/quotations/${item.id}`,
      vehicleLabel: vehicleLabel(snapshot, item.vehicleId),
      occurredAt: item.createdAt,
      amount: item.totalAmount,
      status: item.status,
      linkedRecords: [],
    }));
  const jobOrders = snapshot.jobOrders
    .filter((item) => item.customerId === customerId)
    .map((item) => ({
      id: item.id,
      documentType: "job_order" as const,
      documentLabel: item.jobOrderNumber,
      documentHref: `/job-orders/${item.id}`,
      vehicleLabel: vehicleLabel(snapshot, item.vehicleId),
      occurredAt: item.createdAt,
      amount: null,
      status: item.status,
      linkedRecords: [],
    }));
  const invoices = snapshot.invoices
    .filter((item) => item.customerId === customerId)
    .map((item) => ({
      id: item.id,
      documentType: "invoice" as const,
      documentLabel: item.invoiceNumber,
      documentHref: `/invoices/${item.id}`,
      vehicleLabel: vehicleLabel(snapshot, item.vehicleId),
      occurredAt: item.createdAt,
      amount: item.totalAmount,
      status: item.status,
      linkedRecords: [],
    }));
  const payments = snapshot.payments
    .filter((item) => snapshot.invoices.some((invoice) => invoice.id === item.invoiceId && invoice.customerId === customerId))
    .map((item) => ({
      id: item.id,
      documentType: "payment" as const,
      documentLabel: item.paymentNumber,
      documentHref: `/payments/${item.id}`,
      vehicleLabel: null,
      occurredAt: item.paidAt,
      amount: item.amount,
      paymentMethod: item.paymentMethod,
      linkedRecords: [],
    }));

  return [...quotations, ...jobOrders, ...invoices, ...payments].sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt),
  );
}

export function toAttendancePageData(
  snapshot: SandboxSnapshot,
  searchParams: URLSearchParams,
): AttendancePageData {
  const requestedMonth = searchParams.get("month") ?? undefined;
  const alignedDate = alignAttendanceDateToMonth(searchParams.get("date") ?? undefined, requestedMonth);
  const rosterFilters = resolveAttendancePageFilters({
    date: alignedDate,
    search: searchParams.get("rosterSearch") ?? "",
    role: searchParams.get("rosterRole") ?? "",
    rosterStatus: searchParams.get("rosterStatus") ?? "",
    status: "",
  });
  const attendanceFilters = resolveAttendancePageFilters({
    date: alignedDate,
    search: searchParams.get("attendanceSearch") ?? "",
    role: searchParams.get("attendanceRole") ?? "",
    status: searchParams.get("attendanceStatus") ?? "",
  });

  return {
    rosterData: buildSandboxRoster(snapshot, rosterFilters),
    attendanceData: buildSandboxRoster(snapshot, attendanceFilters, ["admin", "owner"]),
    attendanceCalendar: buildSandboxAttendanceCalendar(snapshot, alignedDate, requestedMonth),
    amendmentsReview: sandboxAmendmentsReview(snapshot),
    leaveManagement: {
      activeStaff: snapshot.staff
        .filter((member) => member.status === "active")
        .map((member) => ({
          id: member.id,
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          role: member.role,
          status: member.status,
        })),
      leaveEntries: [],
    },
  };
}

function buildSandboxRoster(
  snapshot: SandboxSnapshot,
  filters: AttendancePageFilters,
  excludeRoles: Array<StaffListItem["role"]> = [],
): AttendanceRosterData {
  const branchHoliday = holidayOnDate(snapshot, filters.date);
  const needle = filters.search.toLowerCase();
  const rosterBase = snapshot.staff
    .filter((member) => member.status === "active")
    .filter((member) => !excludeRoles.includes(member.role))
    .filter((member) => !filters.role || member.role === filters.role)
    .filter((member) => {
      if (!needle) return true;
      return `${member.firstName} ${member.lastName} ${member.contactNumber ?? ""}`.toLowerCase().includes(needle);
    })
    .sort((left, right) => left.lastName.localeCompare(right.lastName) || left.firstName.localeCompare(right.firstName))
    .map<AttendanceRosterItem>((member) => {
      const attendance = toAttendanceRecord(
        snapshot.attendance.find(
          (item) => item.staffId === member.id && item.attendanceDate === filters.date,
        ) ?? null,
      );
      return {
        staffId: member.id,
        fullName: `${member.firstName} ${member.lastName}`.trim(),
        role: member.role,
        contactNumber: member.contactNumber,
        schedule: member.schedule,
        leaveEntry: null,
        attendance,
        hasMissingTimeout: hasMissingTimeout(attendance),
        isApproved: isAttendanceApproved(attendance),
      };
    });
  const filteredRoster = rosterBase.filter((item) => {
    if (filters.rosterStatus && !matchesRosterStatusFilter(item, filters.rosterStatus, { branchHoliday })) {
      return false;
    }
    if (filters.status && !matchesAttendanceStatusFilter(item, filters.status, { branchHoliday })) {
      return false;
    }
    return true;
  });
  const lockedPeriod = snapshot.payrollPeriods.find(
    (period) =>
      (period.status === "processing" || period.status === "finalized") &&
      filters.date >= period.periodStartDate &&
      filters.date <= period.periodEndDate,
  );

  return {
    branchName: snapshot.branch.name,
    filters,
    branchHoliday,
    summary: buildAttendanceSummary(rosterBase, { branchHoliday }),
    roster: filteredRoster,
    totalMatchingStaff: rosterBase.length,
    visibleCount: filteredRoster.length,
    lockedPeriod: lockedPeriod
      ? {
          payrollPeriodId: lockedPeriod.id,
          payrollPeriodLabel: lockedPeriod.label,
          payrollPeriodStatus: lockedPeriod.status,
        }
      : null,
  };
}

function buildSandboxAttendanceCalendar(
  snapshot: SandboxSnapshot,
  selectedDate: string,
  requestedMonth?: string,
): AttendancePageData["attendanceCalendar"] {
  const targetMonth = resolveCalendarMonth(selectedDate, requestedMonth);
  const monthStartDate = targetMonth.startOf("month").toFormat("yyyy-LL-dd");
  const monthEndDate = targetMonth.endOf("month").toFormat("yyyy-LL-dd");
  const todayDate = getDefaultAttendanceDate();
  const activeStaff = snapshot.staff.filter(
    (member) => member.status === "active" && member.role !== "admin" && member.role !== "owner",
  );
  const days: AttendanceCalendarDaySummary[] = [];
  let cursor = targetMonth.startOf("month");
  const monthEnd = targetMonth.endOf("month").startOf("day");

  while (cursor <= monthEnd) {
    const date = cursor.toFormat("yyyy-LL-dd");
    const isFuture = date > todayDate;
    const branchHoliday = holidayOnDate(snapshot, date);
    let staffCount = 0;
    let recordedCount = 0;
    let approvedCount = 0;
    let attentionCount = 0;
    let absentCount = 0;

    for (const member of activeStaff) {
      const attendance = toAttendanceRecord(
        snapshot.attendance.find((item) => item.staffId === member.id && item.attendanceDate === date) ?? null,
      );
      const isScheduledWorkday =
        !isFuture &&
        !branchHoliday &&
        isScheduledWorkdayForDate(member.schedule, date);
      const isIncomplete = Boolean(attendance?.timeOut === null && attendance?.timeIn);
      const isAbsent = isScheduledWorkday && (!attendance || attendance.status === "absent");
      if (!isScheduledWorkday && !attendance) continue;

      staffCount += 1;
      if (attendance && attendance.status !== "absent") {
        recordedCount += 1;
        if (isAttendanceApproved(attendance)) approvedCount += 1;
      }
      if (isIncomplete) {
        attentionCount += 1;
        continue;
      }
      if (isAbsent) absentCount += 1;
    }

    days.push({
      date,
      status: branchHoliday
        ? "holiday"
        : isFuture
          ? "none"
          : attentionCount > 0
            ? "attention"
            : absentCount > 0
              ? "absent"
              : recordedCount > 0
                ? "complete"
                : "none",
      branchHoliday,
      staffCount,
      recordedCount,
      approvedCount,
      attentionCount,
      absentCount,
    });
    cursor = cursor.plus({ days: 1 });
  }

  const normalizedSelectedDate = DateTime.fromISO(selectedDate);
  return {
    month: targetMonth.toFormat("yyyy-LL"),
    monthLabel: targetMonth.toFormat("LLLL yyyy"),
    monthStartDate,
    monthEndDate,
    selectedDate:
      normalizedSelectedDate.isValid && normalizedSelectedDate.hasSame(targetMonth, "month")
        ? normalizedSelectedDate.toFormat("yyyy-LL-dd")
        : monthStartDate,
    days,
  };
}

function holidayOnDate(snapshot: SandboxSnapshot, date: string): BranchHolidaySummary | null {
  const holiday = snapshot.holidays.find((item) => item.holidayDate === date);
  if (!holiday) return null;
  return {
    id: holiday.id,
    branchId: snapshot.branch.id,
    holidayDate: holiday.holidayDate,
    label: holiday.label,
    holidayKind: holiday.holidayKind,
    payTreatment: holiday.payTreatment,
    notes: holiday.notes ?? null,
  };
}

export function toTimekeepingCalendarPageData(snapshot: SandboxSnapshot): TimekeepingCalendarPageData {
  const shop = ensureSandboxTimekeeping(snapshot);
  const devices = (shop.staffDevices ?? []).flatMap((device) => {
    const staff = shop.staff.find((member) => member.id === device.staffId);
    if (!staff) return [];

    return [{
      id: device.id,
      staffId: device.staffId,
      deviceName: device.deviceName,
      userAgent: device.userAgent,
      firstSeenAt: device.firstSeenAt,
      lastSeenAt: device.lastSeenAt,
      lastIp: device.lastIp,
      status: device.status,
      approvedAt: device.approvedAt,
      approvedByStaffId: null,
      revokedAt: device.revokedAt,
      revokedByStaffId: null,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      staffName: `${staff.firstName} ${staff.lastName}`,
      staffRole: staff.role,
    }];
  });
  const access = shop.attendanceAccess;

  return {
    branchName: shop.branch.name,
    attendanceAccessSettings: {
      requireShopIpForMechanicAttendance: access?.requireShopIpForMechanicAttendance ?? true,
      requireShopLocationForMechanicAttendance: access?.requireShopLocationForMechanicAttendance ?? false,
      allowDtrAmendments: access?.allowDtrAmendments ?? true,
      allowAttendanceAdminOverride: access?.allowAttendanceAdminOverride ?? true,
      geofenceLatitude: access?.geofenceLatitude ?? "",
      geofenceLongitude: access?.geofenceLongitude ?? "",
      geofenceRadiusMeters: access?.geofenceRadiusMeters ?? "150",
    },
    allowedIpAddresses: (shop.allowedIps ?? []).map((item) => ({
      id: item.id,
      branchId: shop.branch.id,
      ipAddress: item.ipAddress,
      label: item.label,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    currentDetectedIp: SANDBOX_SHOP_PUBLIC_IP,
    observedRequestIp: null,
    pendingAmendmentCount: sandboxAmendments(snapshot).filter((item) => item.status === "pending").length,
    pendingDeviceCount: devices.filter((device) => device.status === "pending").length,
    holidays: [...shop.holidays]
      .sort((left, right) => left.holidayDate.localeCompare(right.holidayDate))
      .map((holiday) => ({
        id: holiday.id,
        branchId: shop.branch.id,
        holidayDate: holiday.holidayDate,
        label: holiday.label,
        holidayKind: holiday.holidayKind,
        payTreatment: holiday.payTreatment,
        notes: holiday.notes ?? null,
      })),
    devicesReview: {
      pendingCount: devices.filter((device) => device.status === "pending").length,
      approvedCount: devices.filter((device) => device.status === "approved").length,
      revokedCount: devices.filter((device) => device.status === "revoked").length,
      devices,
    },
  };
}

export function sandboxBranchSelector(snapshot: SandboxSnapshot) {
  return {
    branches: [{ id: snapshot.branch.id, name: snapshot.branch.name, code: snapshot.branch.code }],
    selectedBranchId: snapshot.branch.id,
    canSwitch: false,
    showBranchContext: false,
  };
}

function toAttendanceRecord(
  record: SandboxSnapshot["attendance"][number] | null,
): AttendanceRecordSummary | null {
  if (!record) return null;
  return {
    id: record.id,
    attendanceDate: record.attendanceDate,
    timeIn: record.timeIn,
    timeOut: record.timeOut,
    status: record.status,
    notes: record.notes,
    approvedByStaffId: null,
    approvedAt: record.approvedAt,
  };
}

export function toQuotationListItem(snapshot: SandboxSnapshot, quotation: SandboxSnapshot["quotations"][number]): QuotationListItem {
  return {
    id: quotation.id,
    quotationNumber: quotation.quotationNumber,
    branchId: snapshot.branch.id,
    customerId: quotation.customerId,
    customerName: customerName(snapshot, quotation.customerId),
    vehicleId: quotation.vehicleId,
    vehicleLabel: vehicleLabel(snapshot, quotation.vehicleId),
    status: quotation.status,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    tax: quotation.tax,
    totalAmount: quotation.totalAmount,
    createdAt: quotation.createdAt,
    approvedAt: quotation.approvedAt,
  };
}

export function toQuotationDetail(snapshot: SandboxSnapshot, quotationId: string): QuotationDetail | null {
  const quotation = snapshot.quotations.find((item) => item.id === quotationId);
  if (!quotation) return null;

  const customer = snapshot.customers.find((item) => item.id === quotation.customerId);
  const vehicle = snapshot.vehicles.find((item) => item.id === quotation.vehicleId);
  const jobOrder = snapshot.jobOrders.find((item) => item.quotationId === quotation.id);
  const owner = snapshot.staff.find((item) => item.role === "owner");

  return {
    ...toQuotationListItem(snapshot, quotation),
    customerContactNumber: customer?.contactNumber ?? null,
    customerAddress: customer?.address ?? null,
    vehicleMake: vehicle?.make ?? null,
    vehicleModel: vehicle?.model ?? null,
    vehicleYear: vehicle?.year ?? null,
    vehiclePlateNumber: vehicle?.plateNumber ?? null,
    vehicleVin: vehicle?.vin ?? null,
    natureOfRepair: quotation.natureOfRepair ?? quotation.notes,
    inspectionNotes: quotation.inspectionNotes ?? null,
    preparedByName: owner ? `${owner.firstName} ${owner.lastName}` : null,
    preparedByTitle: owner?.documentTitle ?? null,
    items: snapshot.quotationLines
      .filter((item) => item.parentId === quotation.id)
      .map((item, index) => ({
        id: item.id,
        lineNumber: index + 1,
        itemType: item.itemType,
        productId: item.productId,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitLabel: item.productId
          ? snapshot.products.find((product) => product.id === item.productId)?.unitLabel ?? null
          : null,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    jobOrderId: jobOrder?.id ?? null,
    jobOrderNumber: jobOrder?.jobOrderNumber ?? null,
  };
}

export function filterSandboxQuotations(
  snapshot: SandboxSnapshot,
  search: string,
  status: string,
) {
  const query = search.trim().toLowerCase();
  return snapshot.quotations
    .filter((item) => {
      if (status === "pending") return item.status === "draft" || item.status === "pending_approval";
      if (status) return item.status === status;
      return true;
    })
    .filter((item) => !query || item.quotationNumber.toLowerCase().includes(query))
    .map((item) => toQuotationListItem(snapshot, item));
}

export function toQuotationFormOptions(snapshot: SandboxSnapshot): QuotationFormOptions {
  return {
    customers: snapshot.customers
      .filter((item) => item.status === "active")
      .map((item) => ({ id: item.id, label: item.displayName })),
    vehicles: snapshot.vehicles
      .filter((item) => item.status === "active")
      .map((item) => ({
        id: item.id,
        customerId: item.customerId,
        label: vehicleLabel(snapshot, item.id),
      })),
    products: snapshot.products
      .filter((item) => item.status === "active")
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        oemNumber: null,
        unitLabel: item.unitLabel,
        unitPrice: item.sellingPrice,
        availableQuantity: item.availableQuantity,
        hasStockRecord: true,
      })),
    services: snapshot.services
      .filter((item) => item.status === "active")
      .map((item) => ({
        id: item.id,
        label: item.name,
        category: item.category,
        unitPrice: item.laborPrice,
      })),
    productFormOptions: {
      categories: snapshot.products
        .map((item) => item.categoryName)
        .filter((name): name is string => Boolean(name))
        .filter((name, index, names) => names.indexOf(name) === index)
        .map((name) => ({ id: name, label: name })),
      brands: snapshot.products
        .map((item) => item.brandName)
        .filter((name): name is string => Boolean(name))
        .filter((name, index, names) => names.indexOf(name) === index)
        .map((name) => ({ id: name, label: name })),
      suppliers: snapshot.suppliers.map((item) => ({ id: item.id, label: item.supplierName })),
      units: [{ id: SANDBOX_IDS.unit, label: "pc" }],
      branches: [{ id: snapshot.branch.id, label: snapshot.branch.name }],
      permissions: { canMarkGlobal: true, canSelectOwningBranch: false },
      defaultBranchId: snapshot.branch.id,
    },
    permissions: { canCreateProducts: true, canCreateServices: true },
  };
}

export function toQuotationCreateFlowOptions(snapshot: SandboxSnapshot): QuotationCreateFlowOptions {
  return {
    ...toQuotationFormOptions(snapshot),
    vehicleLookups: {
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
    },
  };
}

export function toQuotationReviseState(snapshot: SandboxSnapshot, quotationId: string) {
  const quotation = toQuotationDetail(snapshot, quotationId);
  if (!quotation) return null;

  const jobOrder = snapshot.jobOrders.find((item) => item.id === quotation.jobOrderId);
  const hasActiveInvoice = snapshot.invoices.some(
    (item) => item.jobOrderId === jobOrder?.id && item.status !== "cancelled",
  );
  const canRevise = canReviseQuotation({
    status: quotation.status,
    jobOrderId: quotation.jobOrderId,
    jobOrderStatus: jobOrder?.status,
    hasActiveInvoice,
  });

  let blockReason: string | null = null;
  if (!canRevise) {
    if (quotation.status !== "approved") blockReason = "Only approved quotations can be revised.";
    else if (!quotation.jobOrderId) blockReason = "This quotation is not linked to a job order.";
    else if (hasActiveInvoice) blockReason = "This quotation cannot be revised after an active invoice has been created.";
    else blockReason = "This quotation cannot be revised while the linked job order is completed, billed, or released.";
  }

  return {
    quotation,
    canRevise,
    blockReason,
    canDelete: canDeleteQuotation(quotation.status) && !quotation.jobOrderId,
    initialValues: mapQuotationDetailToFormValues(quotation),
  };
}

export function toQuotationPrintDocument(
  snapshot: SandboxSnapshot,
  quotationId: string,
): QuotationPrintDocument | null {
  const quotation = toQuotationDetail(snapshot, quotationId);
  if (!quotation) return null;

  const customer = snapshot.customers.find((item) => item.id === quotation.customerId);
  const vehicle = snapshot.vehicles.find((item) => item.id === quotation.vehicleId);
  const createdAt = DateTime.fromISO(quotation.createdAt, { zone: "utc" });

  return {
    quotation,
    businessProfile: toPrintBusinessProfile(snapshot),
    customerSnapshot: {
      companyName: customer?.companyName ?? null,
      email: customer?.email ?? null,
    },
    vehicleSnapshot: {
      color: vehicle?.color ?? null,
      mileage: vehicle?.mileage ?? null,
    },
    validUntil: createdAt.isValid ? createdAt.setZone(ZONE).plus({ days: 14 }).toISO() : null,
  };
}

export function listSandboxJobOrders(
  snapshot: SandboxSnapshot,
  search: string,
  status: "" | "active" | SandboxSnapshot["jobOrders"][number]["status"],
): JobOrderListItem[] {
  const statuses = status ? expandJobOrderStatusFilter(status) : null;
  const query = search.trim().toLowerCase();

  return snapshot.jobOrders
    .filter((item) => !statuses || statuses.includes(item.status))
    .filter((item) => !query || item.jobOrderNumber.toLowerCase().includes(query))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((item) => toJobOrderListItem(snapshot, item));
}

export function toJobOrderDetail(snapshot: SandboxSnapshot, jobOrderId: string): JobOrderDetail | null {
  const jobOrder = snapshot.jobOrders.find((item) => item.id === jobOrderId);
  if (!jobOrder) return null;

  const invoice = snapshot.invoices.find((item) => item.jobOrderId === jobOrder.id && item.status !== "cancelled");
  const completedChecklist = new Set(jobOrder.completedChecklistItemIds ?? []);
  const items = snapshot.jobOrderLines
    .filter((item) => item.parentId === jobOrder.id)
    .map((item, index) => toJobOrderPrintItem(snapshot, jobOrder.id, item, index + 1, completedChecklist.has(item.id)));
  const invoiceStatus = invoice?.status ?? null;
  const canUpdateStatus = true;

  return {
    ...toJobOrderListItem(snapshot, jobOrder, items),
    mileageIn: jobOrder.mileageIn,
    mileageOut: jobOrder.mileageOut,
    customerConcern: jobOrder.customerConcern,
    inspectionNotes: jobOrder.inspectionNotes,
    diagnosis: jobOrder.diagnosis,
    workPerformed: jobOrder.workPerformed,
    allowReleaseWithBalance: snapshot.business.allowReleaseWithBalance,
    requireFullPaymentBeforeRelease: snapshot.business.requireFullPaymentBeforeRelease,
    requireInvoiceBeforeJobCompletion: snapshot.business.requireInvoiceBeforeJobCompletion,
    requireInvoiceBeforeVehicleRelease: snapshot.business.requireInvoiceBeforeVehicleRelease,
    invoiceId: invoice?.id ?? null,
    invoiceNumber: invoice?.invoiceNumber ?? null,
    invoiceStatus,
    invoiceTotalAmount: invoice?.totalAmount ?? null,
    invoicePaidAmount: invoice?.paidAmount ?? null,
    invoiceBalance: invoice?.balance ?? null,
    items,
    mechanics: jobOrderMechanics(snapshot, jobOrder),
    rejectedAdditionalTotal: calculateJobOrderRejectedAdditionalTotal(items),
    canEditDetails: canEditJobOrderDetails(jobOrder.status),
    canEditItems: canEditJobOrderItems(jobOrder.status),
    canAssignMechanics: canAssignMechanics(jobOrder.status),
    canAddAdditionalItems: canAddAdditionalItems(jobOrder.status),
    canResolveAdditionalItems: canResolveAdditionalItems(jobOrder.status),
    canUpdateChecklist: canUpdateJobOrderChecklist(jobOrder.status),
    canUpdateStatus,
    canGenerateInvoice: canGenerateJobOrderInvoice(jobOrder.status, invoice?.id ?? null),
    canReleaseVehicle: canReleaseJobOrderVehicle({
      status: jobOrder.status,
      invoiceId: invoice?.id ?? null,
      invoiceStatus,
      allowReleaseWithBalance: snapshot.business.allowReleaseWithBalance,
      requireFullPaymentBeforeRelease: snapshot.business.requireFullPaymentBeforeRelease,
      requireInvoiceBeforeVehicleRelease: snapshot.business.requireInvoiceBeforeVehicleRelease,
      releasedAt: jobOrder.releasedAt,
    }),
    canDelete: canDeleteJobOrder({
      status: jobOrder.status,
      hasInvoice: Boolean(invoice),
      items,
    }),
    availableNextStatuses: getAllowedJobOrderStatusTransitions(jobOrder.status, {
      invoiceId: invoice?.id ?? null,
      requireInvoiceBeforeJobCompletion: snapshot.business.requireInvoiceBeforeJobCompletion,
    }),
  };
}

export function toJobOrderPrintDocument(
  snapshot: SandboxSnapshot,
  jobOrderId: string,
): JobOrderPrintDocument | null {
  const detail = toJobOrderDetail(snapshot, jobOrderId);
  if (!detail) return null;

  const jobOrder = snapshot.jobOrders.find((item) => item.id === jobOrderId);
  const customer = snapshot.customers.find((item) => item.id === detail.customerId);
  const vehicle = jobOrder ? snapshot.vehicles.find((item) => item.id === jobOrder.vehicleId) : undefined;
  const owner = snapshot.staff.find((item) => item.role === "owner");

  return {
    jobOrder: {
      ...detail,
      customerContactNumber: customer?.contactNumber ?? null,
      customerAddress: customer?.address ?? null,
      vehicleMake: vehicle?.make ?? null,
      vehicleModel: vehicle?.model ?? null,
      vehicleYear: vehicle?.year ?? null,
      vehiclePlateNumber: vehicle?.plateNumber ?? null,
      vehicleVin: vehicle?.vin ?? null,
      preparedByName: owner ? `${owner.firstName} ${owner.lastName}` : null,
      preparedByTitle: owner?.documentTitle ?? null,
    },
    businessProfile: toPrintBusinessProfile(snapshot),
  };
}

function toJobOrderListItem(
  snapshot: SandboxSnapshot,
  jobOrder: SandboxSnapshot["jobOrders"][number],
  items = snapshot.jobOrderLines
    .filter((item) => item.parentId === jobOrder.id)
    .map((item, index) => toJobOrderPrintItem(snapshot, jobOrder.id, item, index + 1, false)),
): JobOrderListItem {
  const quotation = jobOrder.quotationId
    ? snapshot.quotations.find((item) => item.id === jobOrder.quotationId)
    : undefined;
  const invoice = snapshot.invoices.find((item) => item.jobOrderId === jobOrder.id && item.status !== "cancelled");

  return {
    id: jobOrder.id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    quotationId: jobOrder.quotationId,
    quotationNumber: quotation?.quotationNumber ?? null,
    quotationApprovedAt: quotation?.approvedAt ?? null,
    customerId: jobOrder.customerId,
    customerName: customerName(snapshot, jobOrder.customerId),
    vehicleId: jobOrder.vehicleId,
    vehicleLabel: vehicleLabel(snapshot, jobOrder.vehicleId),
    status: jobOrder.status,
    createdAt: jobOrder.createdAt,
    startedAt: jobOrder.startedAt,
    completedAt: jobOrder.completedAt,
    releasedAt: jobOrder.releasedAt,
    isHistorical: false,
    serviceDate: null,
    historicalRecordedAt: null,
    assignedMechanicCount: jobOrderMechanics(snapshot, jobOrder).length,
    billableTotal: calculateJobOrderBillableTotal(items),
    pendingApprovalCount: calculateJobOrderPendingApprovalCount(items),
    pendingApprovalTotal: calculateJobOrderPendingApprovalTotal(items),
    canDelete: canDeleteJobOrder({
      status: jobOrder.status,
      hasInvoice: Boolean(invoice),
      items,
    }),
  };
}

export function toSandboxDocumentEditorData(snapshot: SandboxSnapshot): DocumentEditorPageData {
  return {
    branchName: snapshot.branch.name,
    showBranchContext: false,
    businessProfile: toPrintBusinessProfile(snapshot),
  };
}

export function listSandboxDocuments(snapshot: SandboxSnapshot, search: string, status: string): DocumentListItem[] {
  const query = search.trim().toLowerCase();
  return snapshot.documents
    .map((item) => normalizeSandboxDocument(item))
    .filter((item) => item.status !== "archived")
    .filter((item) => (status === "draft" || status === "published" ? item.status === status : true))
    .filter((item) => !query || item.title.toLowerCase().includes(query))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((item) => ({
      id: item.id,
      title: item.title,
      template: item.template,
      status: item.status,
      updatedAt: item.updatedAt,
    }));
}

function toPrintBusinessProfile(snapshot: SandboxSnapshot) {
  return {
    businessName: snapshot.business.name,
    businessLogoUrl: snapshot.business.logoDataUrl,
    businessVatRegistrationNo: snapshot.business.vatRegistrationNo || null,
    businessContact: snapshot.business.contact || null,
    businessEmail: snapshot.business.email || null,
    businessAddress: snapshot.business.address || null,
    websiteUrl: null,
    facebookLabel: null,
  };
}

function jobOrderMechanics(snapshot: SandboxSnapshot, jobOrder: SandboxSnapshot["jobOrders"][number]) {
  const assignments = jobOrder.mechanicAssignments ?? (jobOrder.assignedStaffId
    ? [{
        id: jobOrder.assignedStaffId,
        staffId: jobOrder.assignedStaffId,
        taskDescription: null,
        startedAt: jobOrder.startedAt,
        completedAt: jobOrder.completedAt,
      }]
    : []);

  return assignments.flatMap((assignment) => {
    const staff = snapshot.staff.find((item) => item.id === assignment.staffId);
    if (!staff) return [];

    return [{
      id: assignment.id,
      staffId: assignment.staffId,
      fullName: `${staff.firstName} ${staff.lastName}`,
      taskDescription: assignment.taskDescription ?? staff.documentTitle,
      startedAt: assignment.startedAt,
      completedAt: assignment.completedAt,
    }];
  });
}

function linePartMovements(
  snapshot: SandboxSnapshot,
  jobOrderId: string,
  line: SandboxSnapshot["jobOrderLines"][number],
) {
  return snapshot.partUsage.filter((item) => {
    if (item.jobOrderId !== jobOrderId || item.productId !== line.productId) return false;
    return item.jobOrderItemId ? item.jobOrderItemId === line.id : true;
  });
}

function toJobOrderPrintItem(
  snapshot: SandboxSnapshot,
  jobOrderId: string,
  line: SandboxSnapshot["jobOrderLines"][number],
  lineNumber: number,
  checklistCompleted: boolean,
): JobOrderItemDetail {
  const product = line.productId ? snapshot.products.find((item) => item.id === line.productId) : undefined;
  const movements = line.productId ? linePartMovements(snapshot, jobOrderId, line) : [];
  const usedQuantity = movements
    .filter((item) => (item.usageType ?? "use") === "use")
    .reduce((sum, item) => sum + item.quantity, 0);
  const returnedQuantity = movements
    .filter((item) => item.usageType === "return")
    .reduce((sum, item) => sum + item.quantity, 0);
  const netUsedQuantity = Math.max(usedQuantity - returnedQuantity, 0);
  const remainingUsageQuantity = Math.max(line.quantity - netUsedQuantity, 0);
  const owner = snapshot.staff.find((item) => item.role === "owner");
  let runningQuantity = 0;
  const usageHistory = movements.map((item) => {
    const direction = (item.usageType ?? "use") === "return" ? -1 : 1;
    const previousQuantity = runningQuantity;
    runningQuantity += direction * item.quantity;
    return {
      id: item.id,
      usageType: (item.usageType ?? "use") as "use" | "return",
      quantity: item.quantity,
      notes: item.notes ?? null,
      createdAt: item.createdAt,
      previousQuantity,
      newQuantity: runningQuantity,
    };
  });

  return {
    id: line.id,
    sourceQuotationItemId: null,
    lineNumber,
    itemType: line.itemType,
    productId: line.productId,
    serviceId: line.serviceId,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    total: line.total,
    isAdditional: line.isAdditional ?? false,
    approvalStatus: line.approvalStatus ?? "not_required",
    usageStatus: netUsedQuantity > 0 ? "used" : returnedQuantity > 0 ? "returned" : "planned",
    checklistCompleted,
    checklistCheckedAt: null,
    checklistCheckedByStaffId: checklistCompleted ? owner?.id ?? null : null,
    checklistCheckedByName: checklistCompleted && owner ? `${owner.firstName} ${owner.lastName}` : null,
    approvedAt: null,
    rejectedAt: null,
    inventoryTracking: product
      ? {
          hasStockRecord: true,
          quantityOnHand: product.availableQuantity,
          availableQuantity: product.availableQuantity,
          reorderLevel: product.reorderLevel,
          shelfLocation: product.shelfLocation,
          isLowStock: product.availableQuantity <= product.reorderLevel,
          usedQuantity,
          returnedQuantity,
          netUsedQuantity,
          remainingUsageQuantity,
          usageHistory,
        }
      : null,
  };
}

export function isQuotationStatusFilter(value: string): value is "" | QuotationStatus | "pending" {
  return (
    value === "" ||
    value === "pending" ||
    value === "draft" ||
    value === "pending_approval" ||
    value === "approved" ||
    value === "rejected" ||
    value === "expired"
  );
}

function alignAttendanceDateToMonth(date: string | undefined, requestedMonth?: string) {
  const resolvedDate = date ? DateTime.fromISO(date) : DateTime.invalid("missing");
  const requestedMonthValue = requestedMonth ? DateTime.fromFormat(requestedMonth, "yyyy-LL") : null;
  if (
    resolvedDate.isValid &&
    requestedMonthValue?.isValid &&
    !resolvedDate.hasSame(requestedMonthValue, "month")
  ) {
    return requestedMonthValue.startOf("month").toFormat("yyyy-LL-dd");
  }
  return resolvedDate.isValid ? resolvedDate.toFormat("yyyy-LL-dd") : getDefaultAttendanceDate();
}

function resolveCalendarMonth(selectedDate: string, requestedMonth?: string) {
  const selected = DateTime.fromISO(selectedDate);
  const selectedMonth = selected.isValid ? selected.startOf("month") : DateTime.now().setZone(ZONE).startOf("month");
  const requested = requestedMonth ? DateTime.fromFormat(requestedMonth, "yyyy-LL") : selectedMonth;
  return requested.isValid ? requested.startOf("month") : selectedMonth;
}

export function listSandboxInvoices(
  snapshot: SandboxSnapshot,
  {
    search = "",
    status = "",
  }: {
    search?: string;
    status?: InvoiceStatus | "";
  } = {},
): InvoiceListItem[] {
  const needle = search.trim().toLowerCase();
  return snapshot.invoices
    .filter((invoice) => {
      if (status && invoice.status !== status) return false;
      if (!needle) return true;
      const haystack = [
        invoice.invoiceNumber,
        customerName(snapshot, invoice.customerId),
        vehicleLabel(snapshot, invoice.vehicleId),
        snapshot.jobOrders.find((item) => item.id === invoice.jobOrderId)?.jobOrderNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .map((invoice) => toInvoiceListItem(snapshot, invoice))
    .sort((left, right) => right.invoiceDate.localeCompare(left.invoiceDate) || right.createdAt.localeCompare(left.createdAt));
}

export function toInvoiceDetail(snapshot: SandboxSnapshot, invoiceId: string): InvoiceDetail | null {
  const invoice = snapshot.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return null;

  const jobOrder = invoice.jobOrderId
    ? snapshot.jobOrders.find((item) => item.id === invoice.jobOrderId) ?? null
    : null;
  const sale = snapshot.posSales.find((item) => item.invoiceId === invoice.id) ?? null;
  const payments = snapshot.payments
    .filter((item) => item.invoiceId === invoice.id)
    .sort((left, right) => right.paidAt.localeCompare(left.paidAt))
    .map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      notes: payment.notes,
      paidAt: payment.paidAt,
    }));
  const items = snapshot.invoiceLines
    .filter((line) => line.parentId === invoice.id)
    .map((line, index) => ({
      id: line.id,
      lineNumber: index + 1,
      itemType: line.itemType,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    }));

  const detailBase: InvoiceDetail = {
    ...toInvoiceListItem(snapshot, invoice),
    customerId: invoice.customerId,
    vehicleId: invoice.vehicleId,
    saleId: sale?.id ?? null,
    saleNumber: sale?.saleNumber ?? null,
    cancelledAt: invoice.cancelledAt ?? null,
    cancelledByUserId: null,
    cancellationReason: invoice.cancellationReason,
    items,
    payments,
    allowPartialPayments: snapshot.business.allowPartialPayments,
    allowReleaseWithBalance: snapshot.business.allowReleaseWithBalance,
    requireFullPaymentBeforeRelease: snapshot.business.requireFullPaymentBeforeRelease,
    jobOrderStatus: jobOrder?.status ?? null,
    releasedAt: jobOrder?.releasedAt ?? null,
    canRecordPayment: false,
    canReleaseVehicle: false,
    canCancel: false,
  };

  return {
    ...detailBase,
    canRecordPayment: canRecordInvoicePayment(detailBase),
    canReleaseVehicle: canReleaseInvoiceVehicle(detailBase),
    canCancel: canCancelInvoice(detailBase),
  };
}

export function listSandboxPayments(
  snapshot: SandboxSnapshot,
  {
    search = "",
    paymentMethod = "",
  }: {
    search?: string;
    paymentMethod?: PaymentMethod | "";
  } = {},
): PaymentListItem[] {
  const needle = search.trim().toLowerCase();
  return snapshot.payments
    .filter((payment) => {
      if (paymentMethod && payment.paymentMethod !== paymentMethod) return false;
      const invoice = snapshot.invoices.find((item) => item.id === payment.invoiceId);
      if (!invoice) return false;
      if (!needle) return true;
      const haystack = [
        payment.paymentNumber,
        invoice.invoiceNumber,
        customerName(snapshot, invoice.customerId),
        payment.referenceNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .map((payment) => {
      const invoice = snapshot.invoices.find((item) => item.id === payment.invoiceId)!;
      const jobOrder = invoice.jobOrderId
        ? snapshot.jobOrders.find((item) => item.id === invoice.jobOrderId)
        : null;
      return {
        id: payment.id,
        invoiceId: payment.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        jobOrderNumber: jobOrder?.jobOrderNumber ?? null,
        customerName: customerName(snapshot, invoice.customerId),
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        paidAt: payment.paidAt,
      } satisfies PaymentListItem;
    })
    .sort((left, right) => right.paidAt.localeCompare(left.paidAt));
}

export function toPaymentDetail(snapshot: SandboxSnapshot, paymentId: string): PaymentDetail | null {
  const payment = snapshot.payments.find((item) => item.id === paymentId);
  if (!payment) return null;
  const invoice = snapshot.invoices.find((item) => item.id === payment.invoiceId);
  if (!invoice) return null;
  const customer = snapshot.customers.find((item) => item.id === invoice.customerId) ?? null;
  const vehicle = invoice.vehicleId
    ? snapshot.vehicles.find((item) => item.id === invoice.vehicleId) ?? null
    : null;
  const jobOrder = invoice.jobOrderId
    ? snapshot.jobOrders.find((item) => item.id === invoice.jobOrderId) ?? null
    : null;
  const sale = snapshot.posSales.find((item) => item.invoiceId === invoice.id) ?? null;
  const owner = snapshot.staff.find((item) => item.role === "owner");
  const paymentsOnInvoice = snapshot.payments
    .filter((item) => item.invoiceId === invoice.id)
    .sort((left, right) => left.paidAt.localeCompare(right.paidAt));
  const priorPaid = paymentsOnInvoice
    .filter((item) => item.paidAt < payment.paidAt || (item.paidAt === payment.paidAt && item.id !== payment.id && item.id < payment.id))
    .reduce((sum, item) => sum + item.amount, 0);
  const balanceBefore = Math.max(0, invoice.totalAmount - priorPaid);
  const balanceAfter = Math.max(0, balanceBefore - payment.amount);

  return {
    id: payment.id,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    jobOrderNumber: jobOrder?.jobOrderNumber ?? null,
    customerName: customerName(snapshot, invoice.customerId),
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber,
    paidAt: payment.paidAt,
    branchId: snapshot.branch.id,
    invoiceDate: invoice.invoiceDate,
    invoiceStatus: invoice.status,
    invoiceTotalAmount: invoice.totalAmount,
    invoicePaidAmount: invoice.paidAmount,
    invoiceBalanceAfterPayment: balanceAfter,
    invoiceBalanceBeforePayment: balanceBefore,
    customerId: invoice.customerId,
    customerContactNumber: customer?.contactNumber ?? null,
    customerAddress: customer?.address ?? null,
    vehicleId: invoice.vehicleId,
    vehicleLabel: vehicleLabel(snapshot, invoice.vehicleId),
    vehicleMake: vehicle?.make ?? null,
    vehicleModel: vehicle?.model ?? null,
    vehicleYear: vehicle?.year ?? null,
    vehiclePlateNumber: vehicle?.plateNumber ?? null,
    vehicleVin: vehicle?.vin ?? null,
    saleId: sale?.id ?? null,
    saleNumber: sale?.saleNumber ?? null,
    jobOrderId: invoice.jobOrderId,
    notes: payment.notes,
    createdAt: payment.paidAt,
    receivedByName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : null,
    receivedByTitle: owner?.documentTitle ?? "Owner",
  };
}

function toInvoiceListItem(
  snapshot: SandboxSnapshot,
  invoice: SandboxSnapshot["invoices"][number],
): InvoiceListItem {
  const jobOrder = invoice.jobOrderId
    ? snapshot.jobOrders.find((item) => item.id === invoice.jobOrderId)
    : null;
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    jobOrderId: invoice.jobOrderId,
    jobOrderNumber: jobOrder?.jobOrderNumber ?? null,
    customerName: customerName(snapshot, invoice.customerId),
    vehicleLabel: vehicleLabel(snapshot, invoice.vehicleId),
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    tax: invoice.tax,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    balance: invoice.balance,
    status: invoice.status,
    createdAt: invoice.createdAt,
  };
}

export function listSandboxProducts(snapshot: SandboxSnapshot, search = ""): ProductListItem[] {
  const needle = search.trim().toLowerCase();
  return snapshot.products
    .filter((product) => {
      if (!needle) return true;
      const haystack = [
        product.name,
        product.sku ?? "",
        product.barcode ?? "",
        product.categoryName ?? "",
        product.brandName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .map((product) => {
      const supplier = snapshot.suppliers.find((item) => item.id === product.supplierId);
      return {
        id: product.id,
        branchId: snapshot.branch.id,
        owningBranchName: snapshot.branch.name,
        isGlobal: false,
        canManage: true,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        productImageUrl: product.productImageUrl,
        productType: product.productType,
        categoryName: product.categoryName,
        brandName: product.brandName,
        unitLabel: product.unitLabel,
        supplierName: supplier?.supplierName ?? null,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        reorderLevel: product.reorderLevel,
        websiteVisible: product.websiteVisible,
        websiteFeatured: false,
        websiteSortOrder: 0,
        websiteSlug: null,
        websiteImageUrl: null,
        websiteShortDescription: null,
        websiteBadge: null,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      } satisfies ProductListItem;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function listSandboxServices(snapshot: SandboxSnapshot, search = ""): ServiceListItem[] {
  const needle = search.trim().toLowerCase();
  return snapshot.services
    .filter((service) => {
      if (!needle) return true;
      const haystack = `${service.name} ${service.category ?? ""} ${service.description ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    })
    .map(
      (service) =>
        ({
          id: service.id,
          branchId: snapshot.branch.id,
          owningBranchName: snapshot.branch.name,
          isGlobal: false,
          canManage: true,
          name: service.name,
          category: service.category,
          description: service.description,
          laborPrice: service.laborPrice,
          estimatedDurationMinutes: service.estimatedDurationMinutes,
          status: service.status,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        }) satisfies ServiceListItem,
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function listSandboxSuppliers(snapshot: SandboxSnapshot, search = ""): SupplierListItem[] {
  const needle = search.trim().toLowerCase();
  return snapshot.suppliers
    .filter((supplier) => {
      if (!needle) return true;
      const haystack = [
        supplier.supplierName,
        supplier.contactPerson ?? "",
        supplier.contactNumber ?? "",
        supplier.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .map(
      (supplier) =>
        ({
          id: supplier.id,
          supplierName: supplier.supplierName,
          contactPerson: supplier.contactPerson,
          contactNumber: supplier.contactNumber,
          email: supplier.email,
          paymentTerms: supplier.paymentTerms,
          status: supplier.status,
          createdAt: supplier.createdAt,
          updatedAt: supplier.updatedAt,
        }) satisfies SupplierListItem,
    )
    .sort((left, right) => left.supplierName.localeCompare(right.supplierName));
}

export function sandboxProductFormOptions(snapshot: SandboxSnapshot): ProductFormOptionsData {
  const categories = [...new Set(snapshot.products.map((product) => product.categoryName).filter(Boolean))];
  const brands = [...new Set(snapshot.products.map((product) => product.brandName).filter(Boolean))];

  return {
    categories: categories.map((name) => ({ id: name ?? "", label: name ?? "" })),
    brands: brands.map((name) => ({ id: name ?? "", label: name ?? "" })),
    suppliers: snapshot.suppliers.map((supplier) => ({ id: supplier.id, label: supplier.supplierName })),
    units: [{ id: SANDBOX_IDS.unit, label: "pc" }],
    branches: [{ id: snapshot.branch.id, label: snapshot.branch.name }],
    permissions: { canMarkGlobal: true, canSelectOwningBranch: false },
    defaultBranchId: snapshot.branch.id,
  };
}

export function toInventoryDashboardData(
  snapshot: SandboxSnapshot,
  filters: {
    search?: string;
    stockState?: InventoryStockFilterState;
    movementType?: InventoryMovementType | "";
  },
): InventoryDashboardData {
  const shop = ensureSandboxStockMovements(snapshot);
  const stocks = shop.products
    .filter((product) => product.status === "active")
    .map(toInventoryStockItem);
  const loweredSearch = filters.search?.trim().toLowerCase() ?? "";

  return {
    branchName: shop.branch.name,
    summary: buildInventorySummary(stocks),
    stocks: filterInventoryStocks(stocks, {
      search: filters.search,
      stockState: filters.stockState,
    }),
    movements: (shop.stockMovements ?? [])
      .filter((movement) => !filters.movementType || movement.movementType === filters.movementType)
      .map((movement) => {
        const product = shop.products.find((item) => item.id === movement.productId);
        return {
          id: movement.id,
          productId: movement.productId,
          productName: product?.name ?? "Unknown product",
          sku: product?.sku ?? null,
          barcode: product?.barcode ?? null,
          movementType: movement.movementType,
          quantity: movement.quantity,
          previousQuantity: movement.previousQuantity,
          newQuantity: movement.newQuantity,
          referenceType: movement.referenceType,
          notes: movement.notes,
          createdAt: movement.createdAt,
        };
      })
      .filter((movement) => {
        if (!loweredSearch) return true;
        return [movement.productName, movement.sku ?? "", movement.barcode ?? ""].join(" ").toLowerCase().includes(loweredSearch);
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    productOptions: stocks.map(mapInventoryStockItemToProductOption),
    branches: [{ id: shop.branch.id, name: shop.branch.name, code: shop.branch.code }],
    selectedBranchId: shop.branch.id,
    canSwitch: false,
    permissions: { canCreateProducts: true },
  };
}

export function toPosTerminalData(snapshot: SandboxSnapshot): PosTerminalData {
  return {
    config: {
      branchId: snapshot.branch.id,
      branchCode: snapshot.branch.code,
      branchName: snapshot.branch.name,
      showBranchContext: false,
      businessName: snapshot.business.name,
      defaultTaxRate: Number(snapshot.business.defaultTaxRate) || 0,
      allowPartialPayments: snapshot.business.allowPartialPayments,
      enableBarcodeSupport: snapshot.business.enableBarcodeSupport,
      receiptFooter: snapshot.business.receiptFooter || null,
    },
    customers: snapshot.customers.map((customer) => ({ id: customer.id, label: customer.displayName })),
    products: snapshot.products
      .filter((product) => product.status === "active")
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        imageUrl: product.productImageUrl,
        unitLabel: product.unitLabel,
        categoryId: product.categoryName,
        categoryName: product.categoryName,
        sellingPrice: product.sellingPrice,
        availableQuantity: product.availableQuantity,
        reorderLevel: product.reorderLevel,
        shelfLocation: product.shelfLocation,
        hasStockRecord: true,
        isLowStock: product.availableQuantity > 0 && product.availableQuantity <= product.reorderLevel,
      })),
    permissions: { canCreateProducts: true },
    productFormOptions: sandboxProductFormOptions(snapshot),
  };
}

function toInventoryStockItem(product: SandboxSnapshot["products"][number]): InventoryStockItem {
  const availableQuantity = product.availableQuantity;
  const reorderLevel = product.reorderLevel;
  const isOutOfStock = availableQuantity <= 0;
  const isLowStock = !isOutOfStock && availableQuantity <= reorderLevel;

  return {
    stockId: product.id,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    barcode: product.barcode,
    categoryName: product.categoryName,
    productType: product.productType,
    unitLabel: product.unitLabel,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    quantityOnHand: availableQuantity,
    reservedQuantity: 0,
    availableQuantity,
    reorderLevel,
    shelfLocation: product.shelfLocation,
    hasStockRecord: true,
    isInStock: !isOutOfStock && !isLowStock,
    isLowStock,
    isOutOfStock,
  };
}

export function toMechanicPortalAttendanceData(snapshot: SandboxSnapshot): MechanicPortalAttendancePageData {
  const shop = ensureSandboxTimekeeping(snapshot);
  const mechanic = sandboxMechanic(shop);
  const todayDate = getBusinessNow().toFormat("yyyy-LL-dd");
  const amendments = sandboxAmendments(shop).filter((item) => item.staffId === mechanic.id);

  return {
    staffId: mechanic.id,
    displayName: mechanic.displayName,
    todayDate,
    settings: sandboxAccessSettings(shop),
    ipStatus: sandboxMechanicIpStatus(shop),
    deviceStatus: sandboxMechanicDeviceStatus(shop, mechanic.id),
    attendance: toAttendanceRecord(
      shop.attendance.find((item) => item.staffId === mechanic.id && item.attendanceDate === todayDate) ?? null,
    ),
    todayAmendments: amendments.filter((item) => item.attendanceDate === todayDate),
    recentAmendments: amendments.slice(0, 6),
  };
}

export function toMechanicPortalAmendmentsData(snapshot: SandboxSnapshot): MechanicPortalAmendmentsPageData {
  const shop = ensureSandboxTimekeeping(snapshot);
  const mechanic = sandboxMechanic(shop);
  const todayDate = getBusinessNow().toFormat("yyyy-LL-dd");

  return {
    displayName: mechanic.displayName,
    todayDate,
    settings: sandboxAccessSettings(shop),
    deviceStatus: sandboxMechanicDeviceStatus(shop, mechanic.id),
    amendments: sandboxAmendments(shop).filter((item) => item.staffId === mechanic.id),
  };
}

export function toMechanicPortalHistoryData(
  snapshot: SandboxSnapshot,
  month?: string,
): MechanicPortalHistoryPageData {
  const shop = ensureSandboxTimekeeping(snapshot);
  const mechanic = sandboxMechanic(shop);
  const todayDate = getBusinessNow().toFormat("yyyy-LL-dd");
  const parsedMonth = month && /^\d{4}-\d{2}$/.test(month) ? DateTime.fromFormat(month, "yyyy-LL", { zone: ZONE }) : null;
  const targetMonth = parsedMonth?.isValid ? parsedMonth.startOf("month") : getBusinessNow().startOf("month");
  const monthStartDate = targetMonth.toFormat("yyyy-LL-dd");
  const monthEndDate = targetMonth.endOf("month").toFormat("yyyy-LL-dd");
  const amendments = sandboxAmendments(shop).filter((item) => item.staffId === mechanic.id);
  const days: MechanicPortalHistoryPageData["days"] = [];
  let cursor = targetMonth.startOf("month");
  const monthEnd = targetMonth.endOf("month").startOf("day");

  while (cursor <= monthEnd) {
    const date = cursor.toFormat("yyyy-LL-dd");
    const attendance = toAttendanceRecord(
      shop.attendance.find((item) => item.staffId === mechanic.id && item.attendanceDate === date) ?? null,
    );
    const dayAmendments = amendments.filter((item) => item.attendanceDate === date);
    const isFuture = date > todayDate;
    const isBranchHoliday = shop.holidays.some((item) => item.holidayDate === date);
    const isScheduledWorkday =
      !isFuture && !isBranchHoliday && isScheduledWorkdayForDate(mechanic.schedule, date);

    days.push({
      date,
      attendance,
      amendments: dayAmendments,
      timeLogs: sandboxTimeLogs(attendance, dayAmendments),
      isFuture,
      isScheduledWorkday,
      isBranchHoliday,
      leaveEntry: null,
      calendarStatus: sandboxMechanicCalendarStatus({
        attendance,
        amendments: dayAmendments,
        isFuture,
        isScheduledWorkday,
      }),
    });
    cursor = cursor.plus({ days: 1 });
  }

  const initialSelectedDate = targetMonth.hasSame(DateTime.fromISO(todayDate, { zone: ZONE }), "month")
    ? todayDate
    : days.find((item) => item.attendance || item.amendments.length > 0)?.date ?? monthStartDate;

  return {
    displayName: mechanic.displayName,
    todayDate,
    month: targetMonth.toFormat("yyyy-LL"),
    monthLabel: targetMonth.toFormat("LLLL yyyy"),
    monthStartDate,
    monthEndDate,
    initialSelectedDate,
    settings: sandboxAccessSettings(shop),
    schedule: mechanic.schedule,
    branchHolidays: shop.holidays.map((holiday) => ({
      id: holiday.id,
      branchId: shop.branch.id,
      holidayDate: holiday.holidayDate,
      label: holiday.label,
      holidayKind: holiday.holidayKind,
      payTreatment: holiday.payTreatment,
      notes: holiday.notes ?? null,
    })),
    days,
    recentAmendments: amendments.slice(0, 6),
  };
}

function sandboxAmendmentsReview(snapshot: SandboxSnapshot) {
  const amendments = sandboxAmendments(snapshot);
  return {
    pendingCount: amendments.filter((item) => item.status === "pending").length,
    totalCount: amendments.length,
    amendments,
  };
}

function sandboxAmendments(snapshot: SandboxSnapshot): DtrAmendmentSummary[] {
  const shop = ensureSandboxTimekeeping(snapshot);
  return [...(shop.dtrAmendments ?? [])]
    .map((amendment) => {
      const staff = shop.staff.find((member) => member.id === amendment.staffId);
      const approver = shop.staff.find((member) => member.id === amendment.approvedByStaffId);
      const rejector = shop.staff.find((member) => member.id === amendment.rejectedByStaffId);
      return {
        id: amendment.id,
        branchId: shop.branch.id,
        staffId: amendment.staffId,
        staffName: staff ? `${staff.firstName} ${staff.lastName}`.trim() : "Staff",
        staffRole: staff?.role ?? "mechanic",
        attendanceId:
          shop.attendance.find(
            (item) => item.staffId === amendment.staffId && item.attendanceDate === amendment.attendanceDate,
          )?.id ?? null,
        attendanceDate: amendment.attendanceDate,
        targetLogType: amendment.targetLogType,
        amendmentType: amendment.amendmentType,
        requestedTimestamp: amendment.requestedTimestamp,
        reason: amendment.reason,
        proofUrl: null,
        status: amendment.status,
        requestedIp: amendment.requestedIp,
        requestUserAgent: null,
        approvedTimestamp: amendment.approvedTimestamp,
        approvedByStaffId: amendment.approvedByStaffId,
        approvedByName: approver ? `${approver.firstName} ${approver.lastName}`.trim() : null,
        rejectedAt: amendment.rejectedAt,
        rejectedByStaffId: amendment.rejectedByStaffId,
        rejectedByName: rejector ? `${rejector.firstName} ${rejector.lastName}`.trim() : null,
        finalTimestamp: amendment.finalTimestamp,
        adminNote: amendment.adminNote,
        createdAt: amendment.createdAt,
        updatedAt: amendment.updatedAt,
      };
    })
    .sort((left, right) => {
      if (left.status === right.status) return right.createdAt.localeCompare(left.createdAt);
      if (left.status === "pending") return -1;
      if (right.status === "pending") return 1;
      return right.createdAt.localeCompare(left.createdAt);
    });
}

function sandboxMechanic(snapshot: SandboxSnapshot) {
  const mechanic = snapshot.staff.find((member) => member.id === SANDBOX_IDS.mechanic) ?? snapshot.staff.find((member) => member.role === "mechanic");
  return {
    id: mechanic?.id ?? SANDBOX_IDS.mechanic,
    displayName: mechanic ? `${mechanic.firstName} ${mechanic.lastName}`.trim() : "Carlo Dela Cruz",
    schedule: mechanic?.schedule ?? null,
  };
}

function sandboxAccessSettings(snapshot: SandboxSnapshot): AttendanceAccessSettings {
  const access = snapshot.attendanceAccess;
  const latitude = Number(access?.geofenceLatitude);
  const longitude = Number(access?.geofenceLongitude);
  const radius = Number(access?.geofenceRadiusMeters);

  return {
    requireShopIpForMechanicAttendance: access?.requireShopIpForMechanicAttendance ?? true,
    requireShopLocationForMechanicAttendance: access?.requireShopLocationForMechanicAttendance ?? false,
    allowDtrAmendments: access?.allowDtrAmendments ?? true,
    allowAttendanceAdminOverride: access?.allowAttendanceAdminOverride ?? true,
    geofence: {
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      radiusMeters: Number.isFinite(radius) && radius > 0 ? radius : 150,
    },
  };
}

function sandboxMechanicIpStatus(snapshot: SandboxSnapshot): MechanicPortalAttendancePageData["ipStatus"] {
  const settings = sandboxAccessSettings(snapshot);
  const matched = (snapshot.allowedIps ?? []).find((item) => item.ipAddress === SANDBOX_SHOP_PUBLIC_IP) ?? null;

  return {
    requestIp: SANDBOX_SHOP_PUBLIC_IP,
    isShopIpRequired: settings.requireShopIpForMechanicAttendance,
    isAllowed: !settings.requireShopIpForMechanicAttendance || Boolean(matched),
    matchedAllowedIp: matched
      ? {
          id: matched.id,
          branchId: snapshot.branch.id,
          ipAddress: matched.ipAddress,
          label: matched.label,
          createdAt: matched.createdAt,
          updatedAt: matched.updatedAt,
        }
      : null,
  };
}

function sandboxMechanicDeviceStatus(snapshot: SandboxSnapshot, staffId: string): MechanicPortalAttendancePageData["deviceStatus"] {
  const devices = (snapshot.staffDevices ?? []).filter((device) => device.staffId === staffId);
  const current = devices.find((device) => device.status === "approved") ?? devices[0] ?? null;
  const summary: StaffDeviceSummary | null = current
    ? {
        id: current.id,
        staffId: current.staffId,
        deviceName: current.deviceName,
        userAgent: current.userAgent,
        firstSeenAt: current.firstSeenAt,
        lastSeenAt: current.lastSeenAt,
        lastIp: current.lastIp,
        status: current.status,
        approvedAt: current.approvedAt,
        approvedByStaffId: null,
        revokedAt: current.revokedAt,
        revokedByStaffId: null,
        createdAt: current.createdAt,
        updatedAt: current.updatedAt,
      }
    : null;

  return {
    status: summary?.status ?? "missing",
    hasDeviceToken: Boolean(summary),
    isApproved: summary?.status === "approved",
    currentDevice: summary,
  };
}

function sandboxTimeLogs(
  attendance: AttendanceRecordSummary | null,
  amendments: DtrAmendmentSummary[],
): AttendanceTimeLogSummary[] {
  if (!attendance) return [];

  return (["time_in", "time_out"] as const).flatMap((logType) => {
    const loggedAt = logType === "time_in" ? attendance.timeIn : attendance.timeOut;
    if (!loggedAt) return [];
    const approvedAmendment = amendments.some(
      (item) => item.status === "approved" && item.targetLogType === logType,
    );

    return [{
      id: `${attendance.id}-${logType}`,
      staffId: "",
      attendanceId: attendance.id,
      amendmentId: null,
      staffDeviceId: null,
      attendanceDate: attendance.attendanceDate,
      logType,
      loggedAt,
      source: approvedAmendment ? "admin_approved_amendment" as const : "mechanic_portal" as const,
      requestIp: SANDBOX_SHOP_PUBLIC_IP,
      isShopIpValid: true,
      requestLatitude: null,
      requestLongitude: null,
      locationAccuracyMeters: null,
      isLocationValid: true,
      isDeviceApproved: true,
      userAgent: null,
      createdAt: loggedAt,
    }];
  });
}

function sandboxMechanicCalendarStatus({
  attendance,
  amendments,
  isFuture,
  isScheduledWorkday,
}: {
  attendance: AttendanceRecordSummary | null;
  amendments: DtrAmendmentSummary[];
  isFuture: boolean;
  isScheduledWorkday: boolean;
}): MechanicPortalHistoryCalendarStatus {
  if (isFuture) return "none";
  if (amendments.some((item) => item.status === "pending")) return "incomplete";
  if (attendance) {
    if ((attendance.status === "unpaid_day_off" || attendance.status === "absent") && !attendance.timeIn && !attendance.timeOut) {
      return attendance.status === "absent" ? "absent" : "none";
    }
    return attendance.timeIn && attendance.timeOut ? "present" : "incomplete";
  }
  return isScheduledWorkday ? "absent" : "none";
}

export function listSandboxStaff(
  snapshot: SandboxSnapshot,
  {
    search = "",
    role = "",
  }: {
    search?: string;
    role?: StaffRole | "";
  } = {},
): StaffListItem[] {
  const needle = search.trim().toLowerCase();
  return snapshot.staff
    .filter((member) => {
      if (role && member.role !== role) return false;
      if (!needle) return true;
      const haystack = [
        member.firstName,
        member.lastName,
        member.staffCode ?? "",
        member.contactNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .map((member) => ({
      id: member.id,
      staffCode: member.staffCode,
      fullName: `${member.firstName} ${member.lastName}`.trim(),
      role: member.role,
      contactNumber: member.contactNumber,
      status: member.status,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export function toSandboxReportsPageData(
  snapshot: SandboxSnapshot,
  input: {
    preset?: string | null;
    from?: string | null;
    to?: string | null;
    groupBy?: string | null;
  } = {},
): ReportsPageData {
  const shop = ensureSandboxStockMovements(snapshot);
  const filters = resolveReportFilters({
    preset: input.preset ?? undefined,
    from: input.from ?? undefined,
    to: input.to ?? undefined,
    groupBy: input.groupBy ?? undefined,
  });
  const { fromIso, toIso } = getReportRangeBounds(filters);

  const quotationRows = shop.quotations;
  const jobOrderRows = shop.jobOrders;
  const invoiceRows = shop.invoices;
  const paymentRows = shop.payments;
  const saleRows = shop.posSales;
  const inventoryStockRows = shop.products.filter((product) => product.status === "active");
  const stockMovementRows = [...(shop.stockMovements ?? [])]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 12);

  const periodQuotations = filterByIsoDateRange(quotationRows, {
    getDate: (row) => row.createdAt,
    fromIso,
    toIso,
  });
  const periodApprovedQuotations = filterByIsoDateRange(quotationRows, {
    getDate: (row) => row.approvedAt,
    fromIso,
    toIso,
  }).filter((row) => row.status === "approved" && row.approvedAt);
  const approvedQuotationValue = sumReportBy(periodApprovedQuotations, (row) => row.totalAmount);
  const periodJobOrders = filterByIsoDateRange(jobOrderRows, {
    getDate: (row) => row.createdAt,
    fromIso,
    toIso,
  });
  const periodReleasedJobOrders = filterByIsoDateRange(jobOrderRows, {
    getDate: (row) => row.releasedAt,
    fromIso,
    toIso,
  });
  const periodInvoices = filterByIsoDateRange(invoiceRows, {
    getDate: (row) => row.createdAt,
    fromIso,
    toIso,
  });
  const periodPayments = filterByIsoDateRange(paymentRows, {
    getDate: (row) => row.paidAt,
    fromIso,
    toIso,
  });
  const periodSales = filterByIsoDateRange(saleRows, {
    getDate: (row) => row.createdAt,
    fromIso,
    toIso,
  });

  const periodInvoiceIds = new Set(periodInvoices.map((row) => row.id));
  const periodInvoiceLines = shop.invoiceLines.filter((line) => periodInvoiceIds.has(line.parentId));
  const serviceInvoiceItems = periodInvoiceLines.filter(
    (item) => item.itemType === "service" || item.itemType === "labor",
  );
  const productInvoiceItems = periodInvoiceLines.filter((item) => item.itemType === "product");
  // Sandbox POS sales already create invoices with the same lines, so product performers
  // come from period invoice lines only (job-order + POS) to avoid double counting.

  const servicesRendered = sumReportBy(serviceInvoiceItems, (item) => item.quantity);
  const averageInvoiceValue =
    periodInvoices.length > 0
      ? roundCurrency(sumReportBy(periodInvoices, (row) => row.totalAmount) / periodInvoices.length)
      : 0;

  const unpaidInvoices = invoiceRows.filter(
    (invoice): invoice is typeof invoice & { status: "unpaid" | "partially_paid" } =>
      invoice.status === "unpaid" || invoice.status === "partially_paid",
  );

  const trendBuckets = buildTrendBuckets(filters);

  return {
    filters,
    periodPerformanceMetrics: [
      {
        label: "Approved quotation value",
        value: approvedQuotationValue,
        kind: "currency",
        helper: `${periodApprovedQuotations.length} quotation${periodApprovedQuotations.length === 1 ? "" : "s"} approved in range`,
        tone: "success",
      },
      {
        label: "Invoiced value",
        value: sumReportBy(periodInvoices, (row) => row.totalAmount),
        kind: "currency",
        helper: `${periodInvoices.length} invoice${periodInvoices.length === 1 ? "" : "s"} created in range`,
      },
      {
        label: "Quotation value",
        value: sumReportBy(periodQuotations, (row) => row.totalAmount),
        kind: "currency",
        helper: `${periodQuotations.length} quotation${periodQuotations.length === 1 ? "" : "s"} created in range`,
      },
      {
        label: "Job orders opened",
        value: periodJobOrders.length,
        kind: "count",
        helper: `${periodReleasedJobOrders.length} released in the same period`,
      },
      {
        label: "Vehicles released",
        value: periodReleasedJobOrders.length,
        kind: "count",
        helper: "Counted from job orders released in the selected range",
      },
      {
        label: "Services rendered",
        value: servicesRendered,
        kind: "quantity",
        helper: "Based on invoiced service and labor line quantities",
      },
      {
        label: "Average invoice value",
        value: averageInvoiceValue,
        kind: "currency",
        helper: periodInvoices.length > 0 ? "Calculated from invoices in this period" : "No invoices in this period",
      },
      {
        label: "POS sales value",
        value: sumReportBy(periodSales, (row) => row.totalAmount),
        kind: "currency",
        helper: `${periodSales.length} completed sale${periodSales.length === 1 ? "" : "s"} in range`,
      },
    ],
    operationalAlerts: [
      {
        label: "Open job orders",
        value: jobOrderRows.filter((row) => !["released", "cancelled"].includes(row.status)).length,
        kind: "count",
        helper: "Current active workload across the shop",
        tone: "warning",
      },
      {
        label: "Unpaid invoices",
        value: unpaidInvoices.length,
        kind: "count",
        helper: "Outstanding receivables that still need collection",
        tone: unpaidInvoices.length > 0 ? "warning" : "success",
      },
      {
        label: "Low Stock Items",
        value: inventoryStockRows.filter(
          (row) => row.availableQuantity > 0 && row.availableQuantity <= row.reorderLevel,
        ).length,
        kind: "count",
        helper: "Available quantity is above zero but at or below reorder level",
        tone: "warning",
      },
      {
        label: "Out of Stock Items",
        value: inventoryStockRows.filter((row) => row.availableQuantity === 0).length,
        kind: "count",
        helper: "Items with no available quantity right now",
        tone: "danger",
      },
      {
        label: "Current on-hand quantity",
        value: sumReportBy(inventoryStockRows, (row) => row.availableQuantity),
        kind: "quantity",
        helper: "Live quantity on hand across all stocked items",
        tone: "info",
      },
    ],
    revenueTrend: buildRevenueTrend({
      buckets: trendBuckets,
      approvedQuotations: periodApprovedQuotations,
      releases: periodReleasedJobOrders,
      getApprovedDate: (row) => row.approvedAt ?? "",
      getApprovedAmount: (row) => row.totalAmount,
      getReleaseDate: (row) => row.releasedAt ?? "",
    }),
    workflowFunnel: buildWorkflowFunnel({
      quotationsCreated: periodQuotations.length,
      quotationsApproved: periodApprovedQuotations.length,
      approvedQuotationValue,
      jobOrdersOpened: periodJobOrders.length,
      vehiclesReleased: periodReleasedJobOrders.length,
    }),
    topServices: buildTopPerformers(
      serviceInvoiceItems.map((item) => ({
        label: item.description,
        quantity: item.quantity,
        amount: item.total,
      })),
    ),
    topProducts: buildTopPerformers(
      productInvoiceItems.map((item) => ({
        label: item.description,
        quantity: item.quantity,
        amount: item.total,
      })),
    ),
    quotationStatusBreakdown: buildStatusBreakdown(periodQuotations.map((row) => row.status)),
    periodJobOrderStatusBreakdown: buildStatusBreakdown(periodJobOrders.map((row) => row.status)),
    liveJobOrderStatusBreakdown: buildStatusBreakdown(jobOrderRows.map((row) => row.status)),
    paymentMethodBreakdown: buildPaymentMethodBreakdown(
      periodPayments.map((row) => ({
        paymentMethod: row.paymentMethod,
        amount: row.amount,
      })),
    ),
    unpaidInvoices: unpaidInvoices
      .map((invoice) => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: customerName(shop, invoice.customerId),
        totalAmount: invoice.totalAmount,
        balance: invoice.balance,
        status: invoice.status,
        createdAt: invoice.createdAt,
      }))
      .sort((left, right) => right.balance - left.balance),
    recentStockMovements: stockMovementRows.map((movement) => {
      const product = shop.products.find((item) => item.id === movement.productId);
      return {
        id: movement.id,
        productName: product?.name ?? "Unknown product",
        movementType: movement.movementType,
        quantity: movement.quantity,
        createdAt: movement.createdAt,
      };
    }),
  };
}

export function toSandboxReportsPrintDocument(
  snapshot: SandboxSnapshot,
  input: {
    preset?: string | null;
    from?: string | null;
    to?: string | null;
    groupBy?: string | null;
  } = {},
): ReportsPrintDocument {
  return {
    reports: toSandboxReportsPageData(snapshot, input),
    businessProfile: {
      businessName: snapshot.business.name,
      businessLogoUrl: snapshot.business.logoDataUrl,
      businessVatRegistrationNo: snapshot.business.vatRegistrationNo || null,
      businessContact: snapshot.business.contact || null,
      businessEmail: snapshot.business.email || null,
      businessAddress: snapshot.business.address || null,
      websiteUrl: null,
      facebookLabel: null,
    },
    generatedAt: DateTime.now().setZone(ZONE).toISO() ?? new Date().toISOString(),
  };
}

function sumReportBy<T>(rows: T[], selector: (row: T) => number) {
  return roundCurrency(rows.reduce((sum, row) => sum + selector(row), 0));
}

const DOCUMENT_SEQUENCE_LABELS: Record<SettingsDocumentSequence["key"], string> = {
  quotation: "Quotation numbers",
  job_order: "Job order numbers",
  invoice: "Invoice numbers",
  sale: "POS sale numbers",
};

function uniqueThemeCandidates(
  candidates: Array<{ hsl: string; label: string }>,
): Array<{ hsl: string; label: string }> {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.hsl.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function toSandboxBusinessSettingsValues(snapshot: SandboxSnapshot): BusinessSettingsValues {
  return {
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
    payrollHolidayPremiumRate: String(Number(snapshot.business.payrollHolidayPremiumRate) * 100),
    payrollDefaultSssAmount: snapshot.business.payrollDefaultSssAmount,
    payrollDefaultPhilhealthAmount: snapshot.business.payrollDefaultPhilhealthAmount,
    payrollDefaultPagibigAmount: snapshot.business.payrollDefaultPagibigAmount,
  };
}

export function toSandboxSettingsTabPageData(
  snapshot: SandboxSnapshot,
  tab: SettingsPageTab,
): SettingsTabPageData {
  const shop = ensureSandboxShopSettings(snapshot);
  const settings = toSandboxBusinessSettingsValues(shop);
  const shopSettings = shop.shopSettings!;

  switch (tab) {
    case "profile":
      return { tab, settings };
    case "branches":
      return {
        tab,
        branches: [
          {
            id: shop.branch.id,
            name: shop.branch.name,
            code: shop.branch.code,
            isMain: shop.branch.isMain,
          },
        ],
        selectedBranchId: shop.branch.id,
        canSwitch: false,
        canManageBranches: false,
        canEditTenantBranding: false,
        branding: {
          tenantId: null,
          slug: "sample-auto-care",
          appName: DEFAULT_BRAND_PACK.appName,
          companyName: shop.business.name,
          supportEmail: shop.business.email || null,
          phone: shop.business.contact || null,
          address: shop.business.address || null,
          primaryColor: shopSettings.themePrimaryColor,
          primaryColorStrong: DEFAULT_BRAND_PACK.primaryColorStrong,
          primaryColorHover: DEFAULT_BRAND_PACK.primaryColorHover,
          accentColor: shopSettings.themeAccentColor,
          accentColorDark: DEFAULT_BRAND_PACK.accentColorDark,
          softColor: DEFAULT_BRAND_PACK.softColor,
          borderColor: DEFAULT_BRAND_PACK.borderColor,
          fontSans: DEFAULT_BRAND_PACK.fontSans,
          fontDisplay: DEFAULT_BRAND_PACK.fontDisplay,
          logoSrc: shop.business.logoDataUrl ?? DEFAULT_BRAND_PACK.logoSrc,
          logoTightSrc: DEFAULT_BRAND_PACK.logoTightSrc,
          markSrc: shop.business.markDataUrl ?? DEFAULT_BRAND_PACK.markSrc,
          faviconSrc: DEFAULT_BRAND_PACK.faviconSrc,
          appleTouchIconSrc: DEFAULT_BRAND_PACK.appleTouchIconSrc,
          loginBackgroundSrc: DEFAULT_BRAND_PACK.loginBackgroundSrc,
          heroBackgroundSrc: DEFAULT_BRAND_PACK.heroBackgroundSrc,
          featureBackgroundSrc: DEFAULT_BRAND_PACK.featureBackgroundSrc,
          facebookUrl: shopSettings.facebookUrl || null,
          facebookLabel: shopSettings.facebookLabel || null,
          mapsUrl: null,
          websiteUrl: shopSettings.websiteUrl || null,
          googleReviewsUrl: null,
          storeHours: DEFAULT_BRAND_PACK.storeHours.map((entry) => ({ ...entry })),
          metaTitle: shop.business.name,
          metaDescription: DEFAULT_BRAND_PACK.metaDescription,
          tagline: DEFAULT_BRAND_PACK.tagline,
          receiptFooterDefault: shop.business.receiptFooter || DEFAULT_BRAND_PACK.receiptFooterDefault,
        },
      };
    case "operations":
      return { tab, settings };
    case "theme":
      return {
        tab,
        themePalette: {
          primaryColor: shopSettings.themePrimaryColor,
          accentColor: shopSettings.themeAccentColor,
          candidates: uniqueThemeCandidates([
            { hsl: shopSettings.themePrimaryColor, label: "Current buttons" },
            { hsl: shopSettings.themeAccentColor, label: "Current accent" },
            { hsl: DEFAULT_BRAND_PACK.primaryColor, label: "Default navy" },
            { hsl: DEFAULT_BRAND_PACK.accentColor, label: "Default red" },
            { hsl: "210 80% 35%", label: "Workshop blue" },
            { hsl: "28 85% 48%", label: "Amber accent" },
          ]),
        },
      };
    case "presence":
      return {
        tab,
        publicPresence: {
          websiteUrl: shopSettings.websiteUrl,
          facebookUrl: shopSettings.facebookUrl,
          facebookLabel: shopSettings.facebookLabel,
          storeHours: shopSettings.storeHours,
        },
      };
    case "documents": {
      const lastValueByKey: Record<SettingsDocumentSequence["key"], number> = {
        quotation: shop.sequences.quotation,
        job_order: shop.sequences.jobOrder,
        invoice: shop.sequences.invoice,
        sale: shop.sequences.pos,
      };
      return {
        tab,
        documentSequences: shopSettings.documentSequences.map((item) => ({
          key: item.key,
          label: DOCUMENT_SEQUENCE_LABELS[item.key],
          prefix: item.prefix,
          padding: item.padding,
          lastValue: lastValueByKey[item.key],
        })),
      };
    }
  }
}

export function toVehicleLookupPageData(snapshot: SandboxSnapshot): VehicleLookupPageData {
  const activeModelCounts = snapshot.vehicleModels.reduce<Map<string, number>>((counts, item) => {
    if (item.status !== "active") return counts;
    counts.set(item.makeId, (counts.get(item.makeId) ?? 0) + 1);
    return counts;
  }, new Map());

  const makes: VehicleMakeItem[] = [...snapshot.vehicleMakes]
    .sort(
      (left, right) =>
        left.status.localeCompare(right.status) ||
        left.sortOrder - right.sortOrder ||
        left.name.localeCompare(right.name),
    )
    .map((item) => ({
      id: item.id,
      name: item.name,
      externalSource: null,
      externalSourceId: null,
      sortOrder: item.sortOrder,
      status: item.status,
      modelCount: activeModelCounts.get(item.id) ?? 0,
    }));

  const models: VehicleModelItem[] = [...snapshot.vehicleModels]
    .sort(
      (left, right) =>
        left.status.localeCompare(right.status) ||
        left.sortOrder - right.sortOrder ||
        left.name.localeCompare(right.name),
    )
    .map((item) => ({
      id: item.id,
      makeId: item.makeId,
      makeName: snapshot.vehicleMakes.find((make) => make.id === item.makeId)?.name ?? "",
      name: item.name,
      externalSource: null,
      externalSourceId: null,
      sortOrder: item.sortOrder,
      status: item.status,
    }));

  const optionGroups: VehicleLookupOptionGroup[] = (
    ["transmission", "fuel_type", "color"] as VehicleLookupType[]
  ).map((lookupType) => ({
    lookupType,
    label: VEHICLE_LOOKUP_LABELS[lookupType],
    items: snapshot.lookupOptions
      .filter((item) => item.lookupType === lookupType)
      .sort(
        (left, right) =>
          left.status.localeCompare(right.status) ||
          left.sortOrder - right.sortOrder ||
          left.label.localeCompare(right.label),
      )
      .map((item) => ({
        id: item.id,
        lookupType,
        label: item.label,
        sortOrder: item.sortOrder,
        status: item.status,
      })),
  }));

  return {
    summary: {
      activeMakes: makes.filter((item) => item.status === "active").length,
      activeModels: models.filter((item) => item.status === "active").length,
      transmissionOptions:
        optionGroups.find((item) => item.lookupType === "transmission")?.items.filter((item) => item.status === "active")
          .length ?? 0,
      fuelTypeOptions:
        optionGroups.find((item) => item.lookupType === "fuel_type")?.items.filter((item) => item.status === "active")
          .length ?? 0,
      colorOptions:
        optionGroups.find((item) => item.lookupType === "color")?.items.filter((item) => item.status === "active")
          .length ?? 0,
    },
    makes,
    models,
    optionGroups,
  };
}
